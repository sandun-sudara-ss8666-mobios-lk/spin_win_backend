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
var QrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../common/prisma/prisma.service");
let QrService = QrService_1 = class QrService {
    prisma;
    configService;
    logger = new common_1.Logger(QrService_1.name);
    tokenTtlSeconds;
    regSessionTtlMinutes;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.tokenTtlSeconds = parseInt(this.configService.get('QR_TOKEN_TTL_SECONDS') || '15', 10);
        this.regSessionTtlMinutes = parseInt(this.configService.get('REG_SESSION_TTL_MINUTES') || '5', 10);
    }
    async generateRotatingToken() {
        const activeDay = await this.prisma.exhibitionDay.findFirst({
            where: { status: 'IN_PROGRESS' },
            include: { exhibition: true },
        });
        if (!activeDay) {
            throw new common_1.BadRequestException('No exhibition day is currently in progress. Start a day first.');
        }
        const tokenStr = 'QR_' + crypto.randomBytes(12).toString('hex').toUpperCase();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.tokenTtlSeconds * 1000);
        const token = await this.prisma.qrSessionToken.create({
            data: {
                token: tokenStr,
                exhibitionId: activeDay.exhibitionId,
                exhibitionDayId: activeDay.id,
                status: 'ACTIVE',
                expiresAt,
            },
        });
        return {
            token: token.token,
            expiresAt: token.expiresAt,
            ttlSeconds: this.tokenTtlSeconds,
            dayNumber: activeDay.dayNumber,
            dayLabel: activeDay.label,
        };
    }
    async getCurrentOrNewToken() {
        const activeDay = await this.prisma.exhibitionDay.findFirst({
            where: { status: 'IN_PROGRESS' },
        });
        if (!activeDay) {
            throw new common_1.BadRequestException('No exhibition day is currently in progress');
        }
        const now = new Date();
        const existing = await this.prisma.qrSessionToken.findFirst({
            where: {
                exhibitionDayId: activeDay.id,
                status: 'ACTIVE',
                expiresAt: { gt: new Date(now.getTime() + 3000) },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (existing) {
            const remainingSeconds = Math.max(0, Math.floor((existing.expiresAt.getTime() - now.getTime()) / 1000));
            return {
                token: existing.token,
                expiresAt: existing.expiresAt,
                ttlSeconds: remainingSeconds,
                dayNumber: activeDay.dayNumber,
                dayLabel: activeDay.label,
            };
        }
        return this.generateRotatingToken();
    }
    async verifyToken(token) {
        const qrToken = await this.prisma.qrSessionToken.findUnique({
            where: { token },
            include: { exhibitionDay: true },
        });
        if (!qrToken) {
            throw new common_1.NotFoundException('Invalid or expired QR token');
        }
        const now = new Date();
        const isExpired = qrToken.expiresAt.getTime() <= now.getTime();
        const isAvailable = qrToken.status === 'ACTIVE' && !isExpired;
        return {
            token: qrToken.token,
            isValid: isAvailable,
            status: qrToken.status,
            isExpired,
            dayNumber: qrToken.exhibitionDay.dayNumber,
            dayLabel: qrToken.exhibitionDay.label,
        };
    }
    async claimToken(token, ipAddress) {
        const now = new Date();
        try {
            return await this.prisma.$transaction(async (tx) => {
                const updateResult = await tx.qrSessionToken.updateMany({
                    where: {
                        token,
                        status: 'ACTIVE',
                        expiresAt: { gt: now },
                    },
                    data: {
                        status: 'CLAIMED',
                        claimedAt: now,
                        claimedByIp: ipAddress || null,
                    },
                });
                if (updateResult.count === 0) {
                    const exists = await tx.qrSessionToken.findUnique({
                        where: { token },
                    });
                    if (!exists) {
                        throw new common_1.NotFoundException('QR token not found');
                    }
                    if (exists.status !== 'ACTIVE') {
                        throw new common_1.ConflictException('This QR code has already been claimed by another visitor');
                    }
                    throw new common_1.BadRequestException('This QR code has expired. Please scan the current code on screen.');
                }
                const qrRecord = await tx.qrSessionToken.findUniqueOrThrow({
                    where: { token },
                    include: { exhibitionDay: true },
                });
                const sessionTokenStr = 'REG_' + crypto.randomBytes(16).toString('hex');
                const sessionExpiresAt = new Date(now.getTime() + this.regSessionTtlMinutes * 60 * 1000);
                const regSession = await tx.visitorRegistrationSession.create({
                    data: {
                        sessionToken: sessionTokenStr,
                        qrTokenId: qrRecord.id,
                        exhibitionDayId: qrRecord.exhibitionDayId,
                        status: 'PENDING',
                        expiresAt: sessionExpiresAt,
                    },
                });
                return {
                    sessionToken: regSession.sessionToken,
                    expiresAt: regSession.expiresAt,
                    dayId: qrRecord.exhibitionDayId,
                    dayNumber: qrRecord.exhibitionDay.dayNumber,
                    dayLabel: qrRecord.exhibitionDay.label,
                };
            });
        }
        catch (err) {
            if (err.code === 'P2002') {
                throw new common_1.ConflictException('This QR code has already been claimed by another visitor');
            }
            throw err;
        }
    }
};
exports.QrService = QrService;
exports.QrService = QrService = QrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], QrService);
//# sourceMappingURL=qr.service.js.map