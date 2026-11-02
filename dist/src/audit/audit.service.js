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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(dto) {
        try {
            let validUserId = null;
            if (dto.userId) {
                const userExists = await this.prisma.user.findUnique({
                    where: { id: dto.userId },
                    select: { id: true },
                });
                if (userExists) {
                    validUserId = dto.userId;
                }
            }
            const payloadStr = dto.payload
                ? typeof dto.payload === 'string'
                    ? dto.payload
                    : JSON.stringify(dto.payload)
                : null;
            return await this.prisma.auditLog.create({
                data: {
                    userId: validUserId,
                    userEmail: dto.userEmail || null,
                    action: dto.action,
                    resourceType: dto.resourceType,
                    resourceId: dto.resourceId || null,
                    payload: payloadStr,
                    ipAddress: dto.ipAddress || null,
                    userAgent: dto.userAgent || null,
                },
            });
        }
        catch (err) {
            this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
        }
    }
    async findRecent(limit = 100, action) {
        return this.prisma.auditLog.findMany({
            where: action ? { action } : undefined,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map