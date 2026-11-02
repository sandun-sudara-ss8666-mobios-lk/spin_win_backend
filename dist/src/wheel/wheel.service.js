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
var WheelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WheelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const pacing_calculator_1 = require("../common/utils/pacing.calculator");
const priority_curve_calculator_1 = require("../common/utils/priority-curve.calculator");
let WheelService = WheelService_1 = class WheelService {
    prisma;
    auditService;
    logger = new common_1.Logger(WheelService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getActiveWheelDisplayConfig() {
        const config = await this.prisma.wheelConfig.findFirst({
            where: { isPublished: true },
            include: {
                slices: {
                    orderBy: { sliceIndex: 'asc' },
                    include: {
                        reward: {
                            select: {
                                id: true,
                                name: true,
                                shortLabel: true,
                                type: true,
                                colorHex: true,
                                iconUrl: true,
                                merchant: {
                                    select: { name: true, logoUrl: true, primaryColor: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!config) {
            throw new common_1.NotFoundException('No published wheel configuration found');
        }
        return {
            version: config.version,
            name: config.name,
            sliceCount: config.sliceCount,
            slices: config.slices.map((s) => ({
                id: s.id,
                sliceIndex: s.sliceIndex,
                label: s.label,
                backgroundColor: s.backgroundColor,
                textColor: s.textColor,
                iconUrl: s.iconUrl || s.reward?.iconUrl || null,
                isNoWin: s.isNoWin,
                merchant: s.reward?.merchant || null,
            })),
        };
    }
    async getAllConfigs() {
        return this.prisma.wheelConfig.findMany({
            orderBy: { version: 'desc' },
            include: {
                slices: {
                    orderBy: { sliceIndex: 'asc' },
                    include: { reward: true },
                },
            },
        });
    }
    async createDraftConfig(dto, userId, userEmail) {
        if (dto.slices.length !== dto.sliceCount) {
            throw new common_1.BadRequestException(`Number of provided slices (${dto.slices.length}) must match sliceCount (${dto.sliceCount})`);
        }
        const indices = dto.slices.map((s) => s.sliceIndex).sort((a, b) => a - b);
        for (let i = 0; i < dto.sliceCount; i++) {
            if (indices[i] !== i) {
                throw new common_1.BadRequestException(`Slices must have contiguous indices from 0 to ${dto.sliceCount - 1}`);
            }
        }
        const highest = await this.prisma.wheelConfig.findFirst({
            orderBy: { version: 'desc' },
            select: { version: true },
        });
        const nextVersion = (highest?.version || 0) + 1;
        const config = await this.prisma.wheelConfig.create({
            data: {
                version: nextVersion,
                name: dto.name.trim(),
                sliceCount: dto.sliceCount,
                isPublished: false,
                createdBy: userEmail || 'ADMIN',
                slices: {
                    create: dto.slices.map((s) => ({
                        sliceIndex: s.sliceIndex,
                        rewardId: s.rewardId || null,
                        isNoWin: s.isNoWin || false,
                        label: s.label.trim(),
                        backgroundColor: s.backgroundColor,
                        textColor: s.textColor,
                        iconUrl: s.iconUrl || null,
                    })),
                },
            },
            include: {
                slices: {
                    orderBy: { sliceIndex: 'asc' },
                    include: { reward: true },
                },
            },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'WHEEL_CONFIG_CREATED',
            resourceType: 'WHEEL_CONFIG',
            resourceId: config.id,
            payload: {
                version: config.version,
                name: config.name,
                sliceCount: config.sliceCount,
            },
        });
        return config;
    }
    async publishConfig(configId, userId, userEmail) {
        const config = await this.prisma.wheelConfig.findUnique({
            where: { id: configId },
            include: {
                slices: {
                    include: { reward: true },
                },
            },
        });
        if (!config) {
            throw new common_1.NotFoundException(`Wheel config with ID ${configId} not found`);
        }
        let hasFallback = false;
        for (const slice of config.slices) {
            if (slice.isNoWin) {
                hasFallback = true;
                break;
            }
            if (slice.reward &&
                (slice.reward.inventoryMode === 'UNLIMITED' ||
                    slice.reward.inventoryMode === 'NO_WIN')) {
                hasFallback = true;
                break;
            }
        }
        if (!hasFallback) {
            throw new common_1.BadRequestException('Cannot publish wheel configuration: at least one positive-weight fallback outcome (UNLIMITED reward or NO_WIN) is required to prevent deadlocks when limited inventory is exhausted.');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.wheelConfig.updateMany({
                where: { isPublished: true },
                data: { isPublished: false },
            });
            return tx.wheelConfig.update({
                where: { id: configId },
                data: { isPublished: true },
                include: {
                    slices: {
                        orderBy: { sliceIndex: 'asc' },
                        include: { reward: true },
                    },
                },
            });
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'WHEEL_CONFIG_PUBLISHED',
            resourceType: 'WHEEL_CONFIG',
            resourceId: updated.id,
            payload: { version: updated.version, name: updated.name },
        });
        return updated;
    }
    async createPriorityList(dto, userId, userEmail) {
        const n = dto.items.length;
        if (n === 0) {
            throw new common_1.BadRequestException('Priority list must contain at least one ranked reward');
        }
        const ranks = dto.items.map((i) => i.rank).sort((a, b) => a - b);
        for (let i = 0; i < n; i++) {
            if (ranks[i] !== i + 1) {
                throw new common_1.BadRequestException(`Priority ranks must be strictly contiguous from 1 to ${n}`);
            }
        }
        const rewardIds = new Set(dto.items.map((i) => i.rewardId));
        if (rewardIds.size !== n) {
            throw new common_1.BadRequestException('Each reward can only be ranked once in a priority list');
        }
        const list = await this.prisma.priorityList.create({
            data: {
                name: dto.name.trim(),
                status: 'DRAFT',
                items: {
                    create: dto.items.map((item) => ({
                        rewardId: item.rewardId,
                        rank: item.rank,
                        multiplier: priority_curve_calculator_1.PriorityCurveCalculator.getMultiplier(item.rank, n),
                    })),
                },
            },
            include: {
                items: {
                    orderBy: { rank: 'asc' },
                    include: { reward: true },
                },
            },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'PRIORITY_LIST_CREATED',
            resourceType: 'PRIORITY_LIST',
            resourceId: list.id,
            payload: { name: list.name, count: n },
        });
        return list;
    }
    async publishPriorityList(listId, userId, userEmail) {
        const list = await this.prisma.priorityList.findUnique({
            where: { id: listId },
            include: { items: true },
        });
        if (!list) {
            throw new common_1.NotFoundException(`Priority list with ID ${listId} not found`);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.priorityList.updateMany({
                where: { status: 'PUBLISHED' },
                data: { status: 'INACTIVE' },
            });
            return tx.priorityList.update({
                where: { id: listId },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                    version: { increment: 1 },
                },
                include: {
                    items: {
                        orderBy: { rank: 'asc' },
                        include: { reward: true },
                    },
                },
            });
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'PRIORITY_LIST_PUBLISHED',
            resourceType: 'PRIORITY_LIST',
            resourceId: updated.id,
            payload: { name: updated.name, version: updated.version },
        });
        return updated;
    }
    async deactivatePriorityList(listId, userId, userEmail) {
        const list = await this.prisma.priorityList.findUnique({
            where: { id: listId },
        });
        if (!list) {
            throw new common_1.NotFoundException(`Priority list with ID ${listId} not found`);
        }
        const updated = await this.prisma.priorityList.update({
            where: { id: listId },
            data: { status: 'INACTIVE' },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'PRIORITY_LIST_DEACTIVATED',
            resourceType: 'PRIORITY_LIST',
            resourceId: updated.id,
        });
        return updated;
    }
    async getAllPriorityLists() {
        return this.prisma.priorityList.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    orderBy: { rank: 'asc' },
                    include: { reward: true },
                },
            },
        });
    }
    async getProbabilityPreview() {
        const activeConfig = await this.prisma.wheelConfig.findFirst({
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
        if (!activeConfig) {
            throw new common_1.NotFoundException('No published wheel configuration found');
        }
        const activeDay = await this.prisma.exhibitionDay.findFirst({
            where: { status: 'IN_PROGRESS' },
        });
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
        const sliceWeightInfos = [];
        for (const slice of activeConfig.slices) {
            if (slice.isNoWin || !slice.reward) {
                sliceWeightInfos.push({
                    sliceId: slice.id,
                    sliceIndex: slice.sliceIndex,
                    rewardId: null,
                    label: slice.label,
                    isNoWin: true,
                    baselineWeight: 10,
                    rank: null,
                    isEligible: true,
                });
                continue;
            }
            const reward = slice.reward;
            let isEligible = reward.isActive;
            if (reward.inventoryMode === 'LIMITED') {
                if (reward.availablePhysicalStock <= 0) {
                    isEligible = false;
                }
                else if (activeDay) {
                    const allocation = reward.dailyAllocations.find((a) => a.exhibitionDayId === activeDay.id);
                    const totalTarget = (allocation?.allocatedQuantity || 0) +
                        (allocation?.carriedForwardQuantity || 0);
                    const awarded = allocation?.awardedQuantity || 0;
                    const refEnd = pacing_calculator_1.PacingCalculator.parseTimeStringOnDate(activeDay.date, activeDay.pacingEndTime);
                    const pacing = pacing_calculator_1.PacingCalculator.calculate({
                        serverTime: now,
                        dayActualStart: activeDay.actualStartedAt || now,
                        referenceEnd: refEnd,
                        dailyTargetAllocation: totalTarget,
                        awardedToday: awarded,
                        availablePhysicalStock: reward.availablePhysicalStock,
                    });
                    isEligible = pacing.eligibleForSpin;
                }
            }
            const rank = reward.id ? rankMap.get(reward.id) || null : null;
            sliceWeightInfos.push({
                sliceId: slice.id,
                sliceIndex: slice.sliceIndex,
                rewardId: reward.id,
                label: slice.label,
                isNoWin: false,
                baselineWeight: reward.baselineWeight || 3,
                rank,
                isEligible,
            });
        }
        const totalRanked = activePriorityList
            ? activePriorityList.items.length
            : 0;
        const previews = priority_curve_calculator_1.PriorityCurveCalculator.calculateProbabilities(sliceWeightInfos, totalRanked);
        return {
            wheelVersion: activeConfig.version,
            activeDayNumber: activeDay?.dayNumber || null,
            activePriorityList: activePriorityList
                ? {
                    id: activePriorityList.id,
                    name: activePriorityList.name,
                    version: activePriorityList.version,
                }
                : null,
            serverTime: now.toISOString(),
            slices: previews,
        };
    }
};
exports.WheelService = WheelService;
exports.WheelService = WheelService = WheelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], WheelService);
//# sourceMappingURL=wheel.service.js.map