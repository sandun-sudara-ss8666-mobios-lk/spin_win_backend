"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SpinsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const pacing_calculator_1 = require("../common/utils/pacing.calculator");
const priority_curve_calculator_1 = require("../common/utils/priority-curve.calculator");
let SpinsService = SpinsService_1 = class SpinsService {
    prisma;
    auditService;
    logger = new common_1.Logger(SpinsService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async executeSpin(dto) {
        const { participationId, idempotencyKey } = dto;
        const existingByIdempotency = await this.prisma.spinRecord.findUnique({
            where: { idempotencyKey },
            include: {
                reward: true,
                wheelSlice: true,
                participation: true,
            },
        });
        if (existingByIdempotency) {
            this.logger.log(`Idempotent spin replay requested for key ${idempotencyKey}`);
            return this.formatSpinResponse(existingByIdempotency, true);
        }
        const participation = await this.prisma.participation.findUnique({
            where: { id: participationId },
            include: {
                exhibitionDay: {
                    include: { exhibition: true },
                },
                spin: {
                    include: {
                        reward: true,
                        wheelSlice: true,
                        participation: true,
                    },
                },
            },
        });
        if (!participation) {
            throw new common_1.NotFoundException(`Participation ${participationId} not found`);
        }
        if (participation.status === 'COMPLETED' && participation.spin) {
            this.logger.log(`Participation ${participationId} already completed spin. Returning existing result.`);
            return this.formatSpinResponse(participation.spin, true);
        }
        if (participation.status !== 'SELECTED') {
            throw new common_1.BadRequestException(`Participation must be in SELECTED state to spin. Current state: ${participation.status}. Please have staff select the participant first.`);
        }
        const day = participation.exhibitionDay;
        if (day.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException(`Cannot spin: Exhibition day is currently ${day.status}`);
        }
        if (day.exhibition.isPaused) {
            throw new common_1.BadRequestException('Cannot spin: Exhibition is currently paused by admin');
        }
        const wheelConfig = await this.prisma.wheelConfig.findFirst({
            where: { isPublished: true },
            include: {
                slices: {
                    orderBy: { sliceIndex: 'asc' },
                    include: {
                        reward: {
                            include: {
                                dailyAllocations: true,
                            },
                        },
                    },
                },
            },
        });
        if (!wheelConfig || wheelConfig.slices.length === 0) {
            throw new common_1.BadRequestException('No active published wheel configuration found');
        }
        const activePriorityList = await this.prisma.priorityList.findFirst({
            where: { status: 'PUBLISHED' },
            include: { items: true },
        });
        const rankMap = new Map();
        if (activePriorityList) {
            for (const item of activePriorityList.items) {
                rankMap.set(item.rewardId, item.rank);
            }
        }
        const now = new Date();
        const refEnd = pacing_calculator_1.PacingCalculator.parseTimeStringOnDate(day.date, day.pacingEndTime);
        const eligibleChoices = [];
        let runningCumulative = 0;
        let fallbackSlice = null;
        const totalRanked = activePriorityList
            ? activePriorityList.items.length
            : 0;
        for (const slice of wheelConfig.slices) {
            if (slice.isNoWin ||
                (slice.reward &&
                    (slice.reward.inventoryMode === 'UNLIMITED' ||
                        slice.reward.inventoryMode === 'NO_WIN'))) {
                if (!fallbackSlice) {
                    fallbackSlice = slice;
                }
            }
            if (slice.isNoWin || !slice.reward) {
                const baseline = 10;
                runningCumulative += baseline;
                eligibleChoices.push({
                    slice,
                    finalWeight: baseline,
                    cumulativeUpper: runningCumulative,
                });
                continue;
            }
            const reward = slice.reward;
            let isEligible = reward.isActive;
            if (reward.inventoryMode === 'LIMITED') {
                if (reward.availablePhysicalStock <= 0) {
                    isEligible = false;
                }
                else {
                    const alloc = reward.dailyAllocations.find((a) => a.exhibitionDayId === day.id);
                    const totalTarget = (alloc?.allocatedQuantity || 0) +
                        (alloc?.carriedForwardQuantity || 0);
                    const awarded = alloc?.awardedQuantity || 0;
                    const pacing = pacing_calculator_1.PacingCalculator.calculate({
                        serverTime: now,
                        dayActualStart: day.actualStartedAt || now,
                        referenceEnd: refEnd,
                        dailyTargetAllocation: totalTarget,
                        awardedToday: awarded,
                        availablePhysicalStock: reward.availablePhysicalStock,
                    });
                    isEligible = pacing.eligibleForSpin;
                }
            }
            if (isEligible) {
                const baseline = Math.max(1, reward.baselineWeight || 3);
                const rank = rankMap.get(reward.id) || null;
                const multiplier = rank
                    ? priority_curve_calculator_1.PriorityCurveCalculator.getMultiplier(rank, totalRanked)
                    : 1.0;
                const finalWeight = Math.round(baseline * multiplier * 100) / 100;
                runningCumulative += finalWeight;
                eligibleChoices.push({
                    slice,
                    finalWeight,
                    cumulativeUpper: runningCumulative,
                });
            }
        }
        let chosenSlice;
        if (eligibleChoices.length === 0 || runningCumulative <= 0) {
            if (!fallbackSlice) {
                throw new common_1.ConflictException('All slices are currently exhausted and no fallback slice was found');
            }
            chosenSlice = fallbackSlice;
        }
        else {
            const randomWeight = crypto.randomInt(0, Math.floor(runningCumulative * 1000)) / 1000;
            const found = eligibleChoices.find((c) => randomWeight < c.cumulativeUpper);
            chosenSlice = found
                ? found.slice
                : eligibleChoices[eligibleChoices.length - 1].slice;
        }
        const isWin = !chosenSlice.isNoWin && chosenSlice.rewardId !== null;
        try {
            return await this.prisma.$transaction(async (tx) => {
                const currentP = await tx.participation.findUnique({
                    where: { id: participationId },
                });
                if (!currentP || currentP.status !== 'SELECTED') {
                    throw new common_1.ConflictException('Participation status changed concurrently. Spin aborted.');
                }
                let selectedReward = chosenSlice.reward;
                if (isWin &&
                    selectedReward &&
                    selectedReward.inventoryMode === 'LIMITED') {
                    const updateRes = await tx.reward.updateMany({
                        where: {
                            id: selectedReward.id,
                            availablePhysicalStock: { gt: 0 },
                        },
                        data: {
                            availablePhysicalStock: { decrement: 1 },
                        },
                    });
                    if (updateRes.count === 0) {
                        if (fallbackSlice) {
                            chosenSlice = fallbackSlice;
                            selectedReward = fallbackSlice.reward;
                        }
                    }
                    else {
                        await tx.dailyAllocation.updateMany({
                            where: {
                                rewardId: selectedReward.id,
                                exhibitionDayId: day.id,
                            },
                            data: {
                                awardedQuantity: { increment: 1 },
                            },
                        });
                        const afterStock = await tx.reward.findUnique({
                            where: { id: selectedReward.id },
                            select: { availablePhysicalStock: true },
                        });
                        await tx.stockLedgerEntry.create({
                            data: {
                                rewardId: selectedReward.id,
                                exhibitionDayId: day.id,
                                entryType: 'SPIN_AWARD',
                                quantityDelta: -1,
                                balanceAfter: afterStock?.availablePhysicalStock || 0,
                                referenceId: participation.readableRef,
                                notes: `Awarded to ${participation.visitorName} (${participation.readableRef})`,
                                createdBy: 'SYSTEM_SPIN_ENGINE',
                            },
                        });
                    }
                }
                const finalIsWin = !chosenSlice.isNoWin && chosenSlice.rewardId !== null;
                const spinRecord = await tx.spinRecord.create({
                    data: {
                        participationId: participation.id,
                        exhibitionDayId: day.id,
                        wheelConfigId: wheelConfig.id,
                        wheelSliceId: chosenSlice.id,
                        rewardId: chosenSlice.rewardId || null,
                        sliceIndex: chosenSlice.sliceIndex,
                        isWin: finalIsWin,
                        idempotencyKey,
                        status: 'COMPLETED',
                        completedAt: new Date(),
                    },
                    include: {
                        reward: true,
                        wheelSlice: true,
                        participation: true,
                    },
                });
                if (finalIsWin && chosenSlice.rewardId) {
                    await tx.award.create({
                        data: {
                            spinId: spinRecord.id,
                            participationId: participation.id,
                            rewardId: chosenSlice.rewardId,
                            exhibitionDayId: day.id,
                            status: 'AWARDED',
                        },
                    });
                }
                await tx.participation.update({
                    where: { id: participation.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                    },
                });
                this.logger.log(`Spin completed for ${participation.readableRef}: Slice ${chosenSlice.sliceIndex} (${chosenSlice.label}), Win: ${finalIsWin}`);
                return this.formatSpinResponse(spinRecord, false);
            });
        }
        catch (err) {
            const existingSpin = await this.prisma.spinRecord.findFirst({
                where: {
                    OR: [{ idempotencyKey }, { participationId }],
                },
                include: {
                    reward: true,
                    wheelSlice: true,
                    participation: true,
                },
            });
            if (existingSpin) {
                this.logger.log(`Concurrent race resolved: returning committed spin for key ${idempotencyKey}`);
                return this.formatSpinResponse(existingSpin, true);
            }
            throw err;
        }
    }
    async getSpinByParticipationId(participationId) {
        const spin = await this.prisma.spinRecord.findUnique({
            where: { participationId },
            include: {
                reward: true,
                wheelSlice: true,
                participation: true,
            },
        });
        if (!spin) {
            throw new common_1.NotFoundException(`No spin record found for participation ${participationId}`);
        }
        return this.formatSpinResponse(spin, true);
    }
    formatSpinResponse(spin, isReplay) {
        return {
            spinId: spin.id,
            participationId: spin.participationId,
            readableRef: spin.participation?.readableRef || null,
            visitorName: spin.participation?.visitorName || null,
            sliceIndex: spin.sliceIndex,
            sliceLabel: spin.wheelSlice?.label || null,
            isWin: spin.isWin,
            reward: spin.reward
                ? {
                    id: spin.reward.id,
                    name: spin.reward.name,
                    shortLabel: spin.reward.shortLabel,
                    type: spin.reward.type,
                    colorHex: spin.reward.colorHex,
                    iconUrl: spin.reward.iconUrl,
                }
                : null,
            completedAt: spin.completedAt,
            isReplay,
        };
    }
};
exports.SpinsService = SpinsService;
exports.SpinsService = SpinsService = SpinsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SpinsService);
//# sourceMappingURL=spins.service.js.map