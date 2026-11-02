import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateMerchantDto,
  UpdateMerchantDto,
} from './dto/create-merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async create(dto: CreateMerchantDto, userId?: string, userEmail?: string) {
    const slug = dto.slug || this.slugify(dto.name);

    const existing = await this.prisma.merchant.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(
        `Merchant with slug "${slug}" already exists`,
      );
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

  async findOne(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        rewards: true,
      },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }

    return merchant;
  }

  async update(
    id: string,
    dto: UpdateMerchantDto,
    userId?: string,
    userEmail?: string,
  ) {
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

  async remove(id: string, userId?: string, userEmail?: string) {
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
}
