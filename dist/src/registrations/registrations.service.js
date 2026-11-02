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
var RegistrationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../common/prisma/prisma.service");
const phone_util_1 = require("../common/utils/phone.util");
let RegistrationsService = RegistrationsService_1 = class RegistrationsService {
    prisma;
    logger = new common_1.Logger(RegistrationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateReadableRef() {
        const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(crypto.randomInt(0, chars.length));
        }
        return `SPIN-${code}`;
    }
    async registerVisitor(dto) {
        const normalizedPhone = phone_util_1.PhoneUtils.normalizeSlPhone(dto.phone);
        if (!normalizedPhone) {
            throw new common_1.BadRequestException('Invalid Sri Lankan mobile phone number. Format must be a valid 9 or 10 digit mobile (e.g., 0771234567 or +94771234567).');
        }
        const cleanName = dto.name.trim();
        if (cleanName.length < 2) {
            throw new common_1.BadRequestException('Visitor name must be at least 2 characters long.');
        }
        const now = new Date();
        return this.prisma.$transaction(async (tx) => {
            const session = await tx.visitorRegistrationSession.findUnique({
                where: { sessionToken: dto.sessionToken },
                include: { exhibitionDay: true },
            });
            if (!session) {
                throw new common_1.NotFoundException('Registration session not found or invalid');
            }
            if (session.status !== 'PENDING') {
                throw new common_1.ConflictException('This registration session has already been completed or expired');
            }
            if (session.expiresAt.getTime() <= now.getTime()) {
                throw new common_1.BadRequestException('Registration session expired. Please scan the QR code again.');
            }
            if (session.exhibitionDay.status !== 'IN_PROGRESS') {
                throw new common_1.BadRequestException(`Cannot register. Exhibition day is currently ${session.exhibitionDay.status}.`);
            }
            await tx.visitorRegistrationSession.update({
                where: { id: session.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: now,
                },
            });
            let readableRef = this.generateReadableRef();
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 5) {
                const existing = await tx.participation.findUnique({
                    where: { readableRef },
                });
                if (!existing) {
                    isUnique = true;
                }
                else {
                    readableRef = this.generateReadableRef();
                    attempts++;
                }
            }
            const participation = await tx.participation.create({
                data: {
                    readableRef,
                    exhibitionDayId: session.exhibitionDayId,
                    regSessionId: session.id,
                    visitorName: cleanName,
                    visitorPhone: normalizedPhone,
                    visitorPhoneRaw: dto.phone.trim(),
                    status: 'WAITING',
                    registeredAt: now,
                },
            });
            this.logger.log(`New visitor registered: ${readableRef} (${cleanName})`);
            return {
                reference: participation.readableRef,
                visitorName: participation.visitorName,
                registeredAt: participation.registeredAt,
                message: 'Registration successful! Watch the main wheel display for your reference number.',
            };
        });
    }
    async getQueue(query) {
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
        const offset = Math.max(0, Number(query.offset) || 0);
        const orderDirection = query.order === 'asc' ? 'asc' : 'desc';
        const activeDay = await this.prisma.exhibitionDay.findFirst({
            where: { status: 'IN_PROGRESS' },
        });
        const whereClause = {};
        if (activeDay) {
            whereClause.exhibitionDayId = activeDay.id;
        }
        if (query.status) {
            if (query.status.includes(',')) {
                const statuses = query.status
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                whereClause.status = { in: statuses };
            }
            else {
                whereClause.status = query.status;
            }
        }
        if (query.search) {
            const s = query.search.trim();
            whereClause.OR = [
                { readableRef: { contains: s } },
                { visitorName: { contains: s } },
                { visitorPhone: { contains: s } },
            ];
        }
        const [total, items] = await Promise.all([
            this.prisma.participation.count({ where: whereClause }),
            this.prisma.participation.findMany({
                where: whereClause,
                orderBy: { registeredAt: orderDirection },
                take: limit,
                skip: offset,
                include: {
                    spin: {
                        include: {
                            reward: {
                                select: { id: true, name: true, shortLabel: true, type: true },
                            },
                        },
                    },
                },
            }),
        ]);
        const phones = [...new Set(items.map((i) => i.visitorPhone))];
        const [repeatCounts, winCounts] = await Promise.all([
            this.prisma.participation.groupBy({
                by: ['visitorPhone'],
                where: { visitorPhone: { in: phones } },
                _count: { id: true },
            }),
            this.prisma.spinRecord.findMany({
                where: {
                    isWin: true,
                    participation: {
                        visitorPhone: { in: phones },
                    },
                },
                select: {
                    participation: {
                        select: { visitorPhone: true },
                    },
                },
            }),
        ]);
        const repeatMap = new Map();
        for (const r of repeatCounts) {
            repeatMap.set(r.visitorPhone, r._count.id);
        }
        const winMap = new Map();
        for (const w of winCounts) {
            const p = w.participation.visitorPhone;
            winMap.set(p, (winMap.get(p) || 0) + 1);
        }
        const enrichedItems = items.map((item) => {
            const totalRegistrations = repeatMap.get(item.visitorPhone) || 1;
            const priorWins = winMap.get(item.visitorPhone) || 0;
            return {
                id: item.id,
                readableRef: item.readableRef,
                visitorName: item.visitorName,
                visitorPhone: item.visitorPhone,
                visitorPhoneMasked: phone_util_1.PhoneUtils.maskPhone(item.visitorPhone),
                status: item.status,
                registeredAt: item.registeredAt,
                selectedAt: item.selectedAt,
                completedAt: item.completedAt,
                spin: item.spin
                    ? {
                        id: item.spin.id,
                        isWin: item.spin.isWin,
                        status: item.spin.status,
                        sliceIndex: item.spin.sliceIndex,
                        reward: item.spin.reward,
                    }
                    : null,
                repeatStats: {
                    isRepeatVisitor: totalRegistrations > 1,
                    totalRegistrations,
                    totalWins: priorWins,
                },
            };
        });
        return {
            data: enrichedItems,
            meta: {
                total,
                limit,
                offset,
                activeDayNumber: activeDay?.dayNumber || null,
            },
        };
    }
    async getParticipationById(id) {
        const p = await this.prisma.participation.findUnique({
            where: { id },
            include: {
                exhibitionDay: true,
                spin: {
                    include: { reward: true },
                },
            },
        });
        if (!p) {
            throw new common_1.NotFoundException(`Participation ${id} not found`);
        }
        return p;
    }
    async selectParticipation(id) {
        const participation = await this.getParticipationById(id);
        if (participation.status === 'COMPLETED') {
            throw new common_1.BadRequestException('This visitor has already spun the wheel');
        }
        if (participation.status === 'DAY_CLOSED') {
            throw new common_1.BadRequestException('This participation was closed with the ended day');
        }
        if (participation.exhibitionDay.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('Exhibition day is not active');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.participation.updateMany({
                where: {
                    exhibitionDayId: participation.exhibitionDayId,
                    status: 'SELECTED',
                    id: { not: participation.id },
                },
                data: {
                    status: 'WAITING',
                    selectedAt: null,
                },
            });
            const updated = await tx.participation.update({
                where: { id: participation.id },
                data: {
                    status: 'SELECTED',
                    selectedAt: new Date(),
                },
            });
            return updated;
        });
    }
    async skipParticipation(id) {
        const participation = await this.getParticipationById(id);
        if (participation.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Cannot skip an already completed participation');
        }
        return this.prisma.participation.update({
            where: { id },
            data: { status: 'SKIPPED' },
        });
    }
    async requeueParticipation(id) {
        const participation = await this.getParticipationById(id);
        if (participation.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Cannot requeue an already completed participation');
        }
        return this.prisma.participation.update({
            where: { id },
            data: { status: 'WAITING', selectedAt: null },
        });
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = RegistrationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map