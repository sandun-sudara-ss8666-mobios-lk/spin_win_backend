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
var ExhibitionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExhibitionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let ExhibitionsService = ExhibitionsService_1 = class ExhibitionsService {
    prisma;
    auditService;
    logger = new common_1.Logger(ExhibitionsService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getActiveExhibition() {
        let exhibition = await this.prisma.exhibition.findFirst({
            where: { isActive: true },
            include: {
                days: {
                    orderBy: { dayNumber: 'asc' },
                },
            },
        });
        if (!exhibition) {
            exhibition = await this.prisma.exhibition.findFirst({
                include: {
                    days: {
                        orderBy: { dayNumber: 'asc' },
                    },
                },
            });
        }
        return exhibition;
    }
    async getDayById(dayId) {
        const day = await this.prisma.exhibitionDay.findUnique({
            where: { id: dayId },
            include: {
                exhibition: true,
            },
        });
        if (!day) {
            throw new common_1.NotFoundException(`Exhibition day with ID ${dayId} not found`);
        }
        return day;
    }
    async getActiveDay(exhibitionId) {
        return this.prisma.exhibitionDay.findFirst({
            where: {
                status: 'IN_PROGRESS',
                ...(exhibitionId ? { exhibitionId } : {}),
            },
            include: {
                exhibition: true,
            },
        });
    }
    async startDay(dayId, userId, userEmail) {
        const day = await this.getDayById(dayId);
        if (day.status === 'IN_PROGRESS') {
            return {
                message: 'Day is already in progress',
                day,
            };
        }
        if (day.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Cannot start a completed exhibition day');
        }
        const existingActive = await this.prisma.exhibitionDay.findFirst({
            where: {
                exhibitionId: day.exhibitionId,
                status: 'IN_PROGRESS',
                id: { not: day.id },
            },
        });
        if (existingActive) {
            throw new common_1.BadRequestException(`Cannot start Day ${day.dayNumber}. Day ${existingActive.dayNumber} is currently IN_PROGRESS. Please end Day ${existingActive.dayNumber} first.`);
        }
        const now = new Date();
        const updatedDay = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.exhibitionDay.update({
                where: { id: day.id },
                data: {
                    status: 'IN_PROGRESS',
                    actualStartedAt: day.actualStartedAt || now,
                },
                include: { exhibition: true },
            });
            return updated;
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'DAY_STARTED',
            resourceType: 'EXHIBITION_DAY',
            resourceId: day.id,
            payload: {
                dayNumber: day.dayNumber,
                label: day.label,
                actualStartedAt: updatedDay.actualStartedAt,
            },
        });
        this.logger.log(`Exhibition Day ${day.dayNumber} started successfully.`);
        return {
            message: `Day ${day.dayNumber} started successfully`,
            day: updatedDay,
        };
    }
    async endDay(dayId, userId, userEmail) {
        const day = await this.getDayById(dayId);
        if (day.status === 'COMPLETED') {
            return {
                message: 'Day is already completed',
                day,
            };
        }
        if (day.status === 'UPCOMING') {
            throw new common_1.BadRequestException('Cannot end an upcoming day that has not started');
        }
        const inFlightSpin = await this.prisma.spinRecord.findFirst({
            where: {
                exhibitionDayId: day.id,
                status: { in: ['STARTING', 'ANIMATING'] },
            },
        });
        if (inFlightSpin) {
            throw new common_1.ConflictException('An active spin is currently in progress. Please wait for the spin animation to resolve before ending the day.');
        }
        const now = new Date();
        const result = await this.prisma.$transaction(async (tx) => {
            const closedParticipations = await tx.participation.updateMany({
                where: {
                    exhibitionDayId: day.id,
                    status: { in: ['WAITING', 'SELECTED', 'SKIPPED'] },
                },
                data: {
                    status: 'DAY_CLOSED',
                },
            });
            const nextDay = await tx.exhibitionDay.findFirst({
                where: {
                    exhibitionId: day.exhibitionId,
                    dayNumber: day.dayNumber + 1,
                },
            });
            const todayAllocations = await tx.dailyAllocation.findMany({
                where: { exhibitionDayId: day.id },
                include: { reward: true },
            });
            for (const alloc of todayAllocations) {
                const totalAvailableToday = alloc.allocatedQuantity + alloc.carriedForwardQuantity;
                const unusedToday = Math.max(0, totalAvailableToday - alloc.awardedQuantity);
                await tx.dailyAllocation.update({
                    where: { id: alloc.id },
                    data: { isFinalized: true },
                });
                if (alloc.reward.carryForward && nextDay && unusedToday > 0) {
                    await tx.dailyAllocation.upsert({
                        where: {
                            rewardId_exhibitionDayId: {
                                rewardId: alloc.rewardId,
                                exhibitionDayId: nextDay.id,
                            },
                        },
                        create: {
                            rewardId: alloc.rewardId,
                            exhibitionDayId: nextDay.id,
                            allocatedQuantity: 0,
                            carriedForwardQuantity: unusedToday,
                            awardedQuantity: 0,
                        },
                        update: {
                            carriedForwardQuantity: unusedToday,
                        },
                    });
                    await tx.stockLedgerEntry.create({
                        data: {
                            rewardId: alloc.rewardId,
                            exhibitionDayId: nextDay.id,
                            entryType: 'CARRY_FORWARD_APPLIED',
                            quantityDelta: unusedToday,
                            balanceAfter: alloc.reward.availablePhysicalStock,
                            referenceId: day.id,
                            notes: `Carried forward ${unusedToday} unused units from Day ${day.dayNumber} to Day ${nextDay.dayNumber}`,
                            createdBy: userEmail || 'SYSTEM',
                        },
                    });
                }
            }
            const updatedDay = await tx.exhibitionDay.update({
                where: { id: day.id },
                data: {
                    status: 'COMPLETED',
                    actualEndedAt: now,
                },
                include: { exhibition: true },
            });
            return { updatedDay, closedCount: closedParticipations.count };
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'DAY_ENDED',
            resourceType: 'EXHIBITION_DAY',
            resourceId: day.id,
            payload: {
                dayNumber: day.dayNumber,
                actualEndedAt: now,
                closedParticipations: result.closedCount,
            },
        });
        this.logger.log(`Exhibition Day ${day.dayNumber} ended. ${result.closedCount} waiting participations marked DAY_CLOSED.`);
        return {
            message: `Day ${day.dayNumber} ended successfully`,
            day: result.updatedDay,
            closedParticipationsCount: result.closedCount,
        };
    }
    async setPauseStatus(exhibitionId, isPaused, userId, userEmail) {
        const exhibition = await this.prisma.exhibition.findUnique({
            where: { id: exhibitionId },
        });
        if (!exhibition) {
            throw new common_1.NotFoundException(`Exhibition with ID ${exhibitionId} not found`);
        }
        const updated = await this.prisma.exhibition.update({
            where: { id: exhibitionId },
            data: { isPaused },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: isPaused ? 'EXHIBITION_PAUSED' : 'EXHIBITION_RESUMED',
            resourceType: 'EXHIBITION',
            resourceId: exhibition.id,
            payload: { isPaused },
        });
        return updated;
    }
    async updateDay(dayId, dto, userId, userEmail) {
        const day = await this.getDayById(dayId);
        const updated = await this.prisma.exhibitionDay.update({
            where: { id: day.id },
            data: {
                label: dto.label || day.label,
                pacingStartTime: dto.pacingStartTime || day.pacingStartTime,
                pacingEndTime: dto.pacingEndTime || day.pacingEndTime,
            },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'DAY_UPDATED',
            resourceType: 'EXHIBITION_DAY',
            resourceId: day.id,
            payload: dto,
        });
        return updated;
    }
};
exports.ExhibitionsService = ExhibitionsService;
exports.ExhibitionsService = ExhibitionsService = ExhibitionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ExhibitionsService);
//# sourceMappingURL=exhibitions.service.js.map