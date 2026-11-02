import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private readonly tokenTtlSeconds: number;
  private readonly regSessionTtlMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.tokenTtlSeconds = parseInt(
      this.configService.get<string>('QR_TOKEN_TTL_SECONDS') || '15',
      10,
    );
    this.regSessionTtlMinutes = parseInt(
      this.configService.get<string>('REG_SESSION_TTL_MINUTES') || '5',
      10,
    );
  }

  /**
   * Generates a new rotating QR session token for the active exhibition day.
   */
  async generateRotatingToken() {
    const activeDay = await this.prisma.exhibitionDay.findFirst({
      where: { status: 'IN_PROGRESS' },
      include: { exhibition: true },
    });

    if (!activeDay) {
      throw new BadRequestException(
        'No exhibition day is currently in progress. Start a day first.',
      );
    }

    const tokenStr =
      'QR_' + crypto.randomBytes(12).toString('hex').toUpperCase();
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

  /**
   * Gets or generates current active QR token for staff display screen.
   */
  async getCurrentOrNewToken() {
    const activeDay = await this.prisma.exhibitionDay.findFirst({
      where: { status: 'IN_PROGRESS' },
    });

    if (!activeDay) {
      throw new BadRequestException(
        'No exhibition day is currently in progress',
      );
    }

    const now = new Date();
    // Find unexpired active token with at least 3 seconds remaining
    const existing = await this.prisma.qrSessionToken.findFirst({
      where: {
        exhibitionDayId: activeDay.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date(now.getTime() + 3000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const remainingSeconds = Math.max(
        0,
        Math.floor((existing.expiresAt.getTime() - now.getTime()) / 1000),
      );
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

  /**
   * Public check for visitor when QR is scanned.
   */
  async verifyToken(token: string) {
    const qrToken = await this.prisma.qrSessionToken.findUnique({
      where: { token },
      include: { exhibitionDay: true },
    });

    if (!qrToken) {
      throw new NotFoundException('Invalid or expired QR token');
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

  /**
   * Visitor clicks "Continue to Register".
   * Atomically consumes QR token and generates 5-minute registration session.
   * Concurrency-safe: duplicate requests fail with 409 Conflict.
   */
  async claimToken(token: string, ipAddress?: string) {
    const now = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Atomic conditional update on status = ACTIVE and not expired
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
          // Check if token exists at all
          const exists = await tx.qrSessionToken.findUnique({
            where: { token },
          });

          if (!exists) {
            throw new NotFoundException('QR token not found');
          }

          if (exists.status !== 'ACTIVE') {
            throw new ConflictException(
              'This QR code has already been claimed by another visitor',
            );
          }

          throw new BadRequestException(
            'This QR code has expired. Please scan the current code on screen.',
          );
        }

        // Fetch the claimed record
        const qrRecord = await tx.qrSessionToken.findUniqueOrThrow({
          where: { token },
          include: { exhibitionDay: true },
        });

        // Issue registration session token (valid for 5 minutes)
        const sessionTokenStr = 'REG_' + crypto.randomBytes(16).toString('hex');
        const sessionExpiresAt = new Date(
          now.getTime() + this.regSessionTtlMinutes * 60 * 1000,
        );

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
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException(
          'This QR code has already been claimed by another visitor',
        );
      }
      throw err;
    }
  }
}
