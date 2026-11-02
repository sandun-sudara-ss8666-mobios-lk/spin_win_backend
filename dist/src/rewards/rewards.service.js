"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RewardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const create_reward_dto_1 = require("./dto/create-reward.dto");
let RewardsService = RewardsService_1 = class RewardsService {
    prisma;
    auditService;
    logger = new common_1.Logger(RewardsService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    computeAutoDailyDistribution(totalStock, days) {
        const result = new Map();
        if (days.length === 0 || totalStock <= 0)
            return result;
        const basePerDay = Math.floor(totalStock / days.length);
        let remainder = totalStock % days.length;
        for (const day of days) {
            let qty = basePerDay;
            if (remainder > 0) {
                qty += 1;
                remainder -= 1;
            }
            result.set(day.id, qty);
        }
        return result;
    }
    async create(dto, userId, userEmail) {
        if (dto.inventoryMode === create_reward_dto_1.InventoryModeEnum.LIMITED &&
            (!dto.totalPhysicalStock || dto.totalPhysicalStock <= 0)) {
            throw new common_1.BadRequestException('Total physical stock must be greater than 0 for LIMITED rewards');
        }
        const totalStock = dto.inventoryMode === create_reward_dto_1.InventoryModeEnum.LIMITED
            ? dto.totalPhysicalStock
            : 0;
        if (dto.merchantId) {
            const merchant = await this.prisma.merchant.findUnique({
                where: { id: dto.merchantId },
            });
            if (!merchant) {
                throw new common_1.NotFoundException(`Merchant with ID ${dto.merchantId} not found`);
            }
        }
        const activeExhibition = await this.prisma.exhibition.findFirst({
            where: { isActive: true },
            include: {
                days: {
                    orderBy: { dayNumber: 'asc' },
                },
            },
        });
        if (!activeExhibition || activeExhibition.days.length === 0) {
            throw new common_1.BadRequestException('No active exhibition with days found to allocate rewards');
        }
        const eligibleDays = activeExhibition.days.filter((d) => d.status !== 'COMPLETED');
        if (eligibleDays.length === 0) {
            throw new common_1.BadRequestException('All exhibition days are already completed');
        }
        if (dto.distributionStrategy === create_reward_dto_1.DistributionStrategyEnum.CUSTOM_DAILY) {
            if (!dto.customDailyAllocations) {
                throw new common_1.BadRequestException('customDailyAllocations must be provided when strategy is CUSTOM_DAILY');
            }
            const sumAllocated = Object.values(dto.customDailyAllocations).reduce((a, b) => a + Number(b), 0);
            if (sumAllocated > totalStock) {
                throw new common_1.BadRequestException(`Sum of custom daily allocations (${sumAllocated}) exceeds total physical stock (${totalStock})`);
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const reward = await tx.reward.create({
                data: {
                    merchantId: dto.merchantId || null,
                    name: dto.name.trim(),
                    description: dto.description || null,
                    type: dto.type,
                    shortLabel: dto.shortLabel.trim(),
                    inventoryMode: dto.inventoryMode,
                    distributionStrategy: dto.distributionStrategy,
                    totalPhysicalStock: totalStock,
                    availablePhysicalStock: totalStock,
                    retiredStock: 0,
                    carryForward: dto.carryForward ?? true,
                    baselineWeight: dto.baselineWeight ?? 3,
                    colorHex: dto.colorHex || null,
                    iconUrl: dto.iconUrl || null,
                },
            });
            if (totalStock > 0) {
                await tx.stockLedgerEntry.create({
                    data: {
                        rewardId: reward.id,
                        entryType: 'INITIAL_STOCK',
                        quantityDelta: totalStock,
                        balanceAfter: totalStock,
                        notes: 'Initial physical inventory deposit',
                        createdBy: userEmail || 'ADMIN',
                    },
                });
            }
            if (dto.distributionStrategy === create_reward_dto_1.DistributionStrategyEnum.AUTO_DAILY) {
                const distribution = this.computeAutoDailyDistribution(totalStock, eligibleDays);
                for (const day of activeExhibition.days) {
                    const qty = distribution.get(day.id) || 0;
                    await tx.dailyAllocation.create({
                        data: {
                            rewardId: reward.id,
                            exhibitionDayId: day.id,
                            allocatedQuantity: qty,
                            carriedForwardQuantity: 0,
                            awardedQuantity: 0,
                        },
                    });
                }
            }
            else if (dto.distributionStrategy === create_reward_dto_1.DistributionStrategyEnum.CUSTOM_DAILY) {
                for (const day of activeExhibition.days) {
                    const qty = Number(dto.customDailyAllocations?.[day.id]) || 0;
                    await tx.dailyAllocation.create({
                        data: {
                            rewardId: reward.id,
                            exhibitionDayId: day.id,
                            allocatedQuantity: qty,
                            carriedForwardQuantity: 0,
                            awardedQuantity: 0,
                        },
                    });
                }
            }
            else {
                for (const day of activeExhibition.days) {
                    await tx.dailyAllocation.create({
                        data: {
                            rewardId: reward.id,
                            exhibitionDayId: day.id,
                            allocatedQuantity: totalStock,
                            carriedForwardQuantity: 0,
                            awardedQuantity: 0,
                        },
                    });
                }
            }
            await this.auditService.log({
                userId,
                userEmail,
                action: 'REWARD_CREATED',
                resourceType: 'REWARD',
                resourceId: reward.id,
                payload: {
                    name: reward.name,
                    totalStock,
                    strategy: reward.distributionStrategy,
                },
            });
            return reward;
        });
    }
    async findAll(onlyActive = true) {
        return this.prisma.reward.findMany({
            where: onlyActive ? { isActive: true } : undefined,
            include: {
                merchant: {
                    select: { id: true, name: true, logoUrl: true, primaryColor: true },
                },
                dailyAllocations: {
                    include: {
                        exhibitionDay: {
                            select: {
                                dayNumber: true,
                                label: true,
                                date: true,
                                status: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { awards: true, spins: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const reward = await this.prisma.reward.findUnique({
            where: { id },
            include: {
                merchant: true,
                dailyAllocations: {
                    include: {
                        exhibitionDay: true,
                    },
                },
                stockLedger: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!reward) {
            throw new common_1.NotFoundException(`Reward with ID ${id} not found`);
        }
        return reward;
    }
    async update(id, dto, userId, userEmail) {
        await this.findOne(id);
        const updated = await this.prisma.reward.update({
            where: { id },
            data: {
                name: dto.name ? dto.name.trim() : undefined,
                description: dto.description,
                shortLabel: dto.shortLabel ? dto.shortLabel.trim() : undefined,
                carryForward: dto.carryForward,
                baselineWeight: dto.baselineWeight,
                colorHex: dto.colorHex,
                iconUrl: dto.iconUrl,
                isActive: dto.isActive,
            },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'REWARD_UPDATED',
            resourceType: 'REWARD',
            resourceId: id,
            payload: dto,
        });
        return updated;
    }
    async adjustStock(id, dto, userId, userEmail) {
        const reward = await this.findOne(id);
        if (reward.inventoryMode !== 'LIMITED') {
            throw new common_1.BadRequestException('Stock adjustments only apply to LIMITED inventory rewards');
        }
        const currentTotal = reward.totalPhysicalStock;
        const currentAvailable = reward.availablePhysicalStock;
        const awardedCount = currentTotal - currentAvailable - reward.retiredStock;
        const newTotal = currentTotal + dto.quantityDelta;
        const newAvailable = currentAvailable + dto.quantityDelta;
        if (newTotal < awardedCount) {
            throw new common_1.BadRequestException(`Cannot reduce stock by ${Math.abs(dto.quantityDelta)}. Minimum physical stock required is ${awardedCount} (already awarded).`);
        }
        if (newAvailable < 0) {
            throw new common_1.BadRequestException(`Cannot reduce available stock below 0. Currently available: ${currentAvailable}.`);
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedReward = await tx.reward.update({
                where: { id },
                data: {
                    totalPhysicalStock: newTotal,
                    availablePhysicalStock: newAvailable,
                },
            });
            await tx.stockLedgerEntry.create({
                data: {
                    rewardId: id,
                    entryType: 'ADMIN_ADJUSTMENT',
                    quantityDelta: dto.quantityDelta,
                    balanceAfter: newAvailable,
                    notes: dto.notes,
                    createdBy: userEmail || 'ADMIN',
                },
            });
            if (reward.distributionStrategy === 'AUTO_DAILY') {
                const remainingDays = await tx.exhibitionDay.findMany({
                    where: { status: { in: ['IN_PROGRESS', 'UPCOMING'] } },
                    orderBy: { dayNumber: 'asc' },
                });
                if (remainingDays.length > 0) {
                    const rebalanceMap = this.computeAutoDailyDistribution(newAvailable, remainingDays);
                    for (const day of remainingDays) {
                        const newAlloc = rebalanceMap.get(day.id) || 0;
                        await tx.dailyAllocation.updateMany({
                            where: {
                                rewardId: id,
                                exhibitionDayId: day.id,
                            },
                            data: {
                                allocatedQuantity: newAlloc,
                            },
                        });
                    }
                }
            }
            await this.auditService.log({
                userId,
                userEmail,
                action: 'STOCK_ADJUSTED',
                resourceType: 'REWARD',
                resourceId: id,
                payload: {
                    delta: dto.quantityDelta,
                    newTotal,
                    newAvailable,
                    notes: dto.notes,
                },
            });
            return updatedReward;
        });
    }
    async cancelAward(awardId, dto, userId, userEmail) {
        const award = await this.prisma.award.findUnique({
            where: { id: awardId },
            include: {
                reward: true,
                exhibitionDay: true,
            },
        });
        if (!award) {
            throw new common_1.NotFoundException(`Award with ID ${awardId} not found`);
        }
        if (award.status === 'CANCELLED') {
            return {
                message: 'Award was already cancelled',
                award,
            };
        }
        const now = new Date();
        return this.prisma.$transaction(async (tx) => {
            let ledgerType;
            if (dto.resolution === create_reward_dto_1.CancellationResolutionEnum.IMMEDIATE_RETURN) {
                ledgerType = 'AWARD_CANCELLED_RETURN_IMMEDIATE';
                await tx.reward.update({
                    where: { id: award.rewardId },
                    data: {
                        availablePhysicalStock: { increment: 1 },
                    },
                });
                await tx.dailyAllocation.updateMany({
                    where: {
                        rewardId: award.rewardId,
                        exhibitionDayId: award.exhibitionDayId,
                    },
                    data: {
                        awardedQuantity: { decrement: 1 },
                    },
                });
            }
            else if (dto.resolution === create_reward_dto_1.CancellationResolutionEnum.RETURN_TO_PACING) {
                ledgerType = 'AWARD_CANCELLED_RETURN_PACING';
                await tx.reward.update({
                    where: { id: award.rewardId },
                    data: {
                        availablePhysicalStock: { increment: 1 },
                    },
                });
            }
            else if (dto.resolution === create_reward_dto_1.CancellationResolutionEnum.RETIRE) {
                ledgerType = 'AWARD_CANCELLED_RETIRE';
                await tx.reward.update({
                    where: { id: award.rewardId },
                    data: {
                        retiredStock: { increment: 1 },
                    },
                });
            }
            const updatedReward = await tx.reward.findUnique({
                where: { id: award.rewardId },
            });
            await tx.stockLedgerEntry.create({
                data: {
                    rewardId: award.rewardId,
                    exhibitionDayId: award.exhibitionDayId,
                    entryType: ledgerType,
                    quantityDelta: dto.resolution === create_reward_dto_1.CancellationResolutionEnum.RETIRE ? 0 : 1,
                    balanceAfter: updatedReward?.availablePhysicalStock || 0,
                    referenceId: award.id,
                    notes: `Award cancelled: ${dto.reason} (${dto.resolution})`,
                    createdBy: userEmail || 'ADMIN',
                },
            });
            const updatedAward = await tx.award.update({
                where: { id: award.id },
                data: {
                    status: 'CANCELLED',
                    cancellationResolution: dto.resolution,
                    cancellationReason: dto.reason,
                    cancelledBy: userEmail || 'ADMIN',
                    cancelledAt: now,
                },
            });
            await this.auditService.log({
                userId,
                userEmail,
                action: 'AWARD_CANCELLED',
                resourceType: 'AWARD',
                resourceId: award.id,
                payload: {
                    rewardId: award.rewardId,
                    resolution: dto.resolution,
                    reason: dto.reason,
                },
            });
            return {
                message: `Award successfully cancelled with resolution ${dto.resolution}`,
                award: updatedAward,
            };
        });
    }
    async getAwards(exhibitionDayId) {
        return this.prisma.award.findMany({
            where: exhibitionDayId ? { exhibitionDayId } : undefined,
            include: {
                reward: true,
                participation: true,
                exhibitionDay: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = RewardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RewardsService);
//# sourceMappingURL=rewards.service.js.map