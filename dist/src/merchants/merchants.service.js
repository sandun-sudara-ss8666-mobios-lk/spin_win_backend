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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let MerchantsService = class MerchantsService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    async create(dto, userId, userEmail) {
        const slug = dto.slug || this.slugify(dto.name);
        const existing = await this.prisma.merchant.findUnique({
            where: { slug },
        });
        if (existing) {
            throw new common_1.ConflictException(`Merchant with slug "${slug}" already exists`);
        }
        const merchant = await this.prisma.merchant.create({
            data: {
                name: dto.name.trim(),
                slug,
                logoUrl: dto.logoUrl,
                primaryColor: dto.primaryColor,
                contactEmail: dto.contactEmail,
                contactPhone: dto.contactPhone,
            },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'MERCHANT_CREATED',
            resourceType: 'MERCHANT',
            resourceId: merchant.id,
            payload: dto,
        });
        return merchant;
    }
    async findAll(onlyActive = true) {
        return this.prisma.merchant.findMany({
            where: onlyActive ? { isActive: true } : undefined,
            include: {
                _count: {
                    select: { rewards: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const merchant = await this.prisma.merchant.findUnique({
            where: { id },
            include: {
                rewards: true,
            },
        });
        if (!merchant) {
            throw new common_1.NotFoundException(`Merchant with ID ${id} not found`);
        }
        return merchant;
    }
    async update(id, dto, userId, userEmail) {
        await this.findOne(id);
        const updated = await this.prisma.merchant.update({
            where: { id },
            data: {
                name: dto.name ? dto.name.trim() : undefined,
                logoUrl: dto.logoUrl,
                primaryColor: dto.primaryColor,
                contactEmail: dto.contactEmail,
                contactPhone: dto.contactPhone,
                isActive: dto.isActive,
            },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'MERCHANT_UPDATED',
            resourceType: 'MERCHANT',
            resourceId: id,
            payload: dto,
        });
        return updated;
    }
    async remove(id, userId, userEmail) {
        await this.findOne(id);
        const updated = await this.prisma.merchant.update({
            where: { id },
            data: { isActive: false },
        });
        await this.auditService.log({
            userId,
            userEmail,
            action: 'MERCHANT_DEACTIVATED',
            resourceType: 'MERCHANT',
            resourceId: id,
        });
        return updated;
    }
};
exports.MerchantsService = MerchantsService;
exports.MerchantsService = MerchantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], MerchantsService);
//# sourceMappingURL=merchants.service.js.map