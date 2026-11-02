import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface AuditLogDto {
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: AuditLogDto) {
    try {
      let validUserId: string | null = null;
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
    } catch (err: any) {
      this.logger.error(
        `Failed to record audit log: ${err.message}`,
        err.stack,
      );
    }
  }

  async findRecent(limit = 100, action?: string) {
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
}
