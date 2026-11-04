import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { PhoneUtils } from '../common/utils/phone.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RegisterVisitorDto, QueryQueueDto } from './dto/register-visitor.dto';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /**
   * Generates a readable 8-character reference code (e.g. SPIN-4K8P)
   */
  private generateReadableRef(): string {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // Exclude ambiguous 0, O, 1, I, L
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return `SPIN-${code}`;
  }

  /**
   * Public registration by visitor.
   * Validates SL phone and session token, registers participation, returns reference only.
   */
  async registerVisitor(dto: RegisterVisitorDto) {
    const normalizedPhone = PhoneUtils.normalizeSlPhone(dto.phone);
    if (!normalizedPhone) {
      throw new BadRequestException(
        'Invalid Sri Lankan mobile phone number. Format must be a valid 9 or 10 digit mobile (e.g., 0771234567 or +94771234567).',
      );
    }

    const cleanName = dto.name.trim();
    if (cleanName.length < 2) {
      throw new BadRequestException(
        'Visitor name must be at least 2 characters long.',
      );
    }

    const now = new Date();

    const confirmation = await this.prisma.$transaction(async (tx) => {
      // 1. Validate registration session token
      const session = await tx.visitorRegistrationSession.findUnique({
        where: { sessionToken: dto.sessionToken },
        include: { exhibitionDay: true },
      });

      if (!session) {
        throw new NotFoundException(
          'Registration session not found or invalid',
        );
      }

      if (session.status !== 'PENDING') {
        throw new ConflictException(
          'This registration session has already been completed or expired',
        );
      }

      if (session.expiresAt.getTime() <= now.getTime()) {
        throw new BadRequestException(
          'Registration session expired. Please scan the QR code again.',
        );
      }

      // 2. Validate that exhibition day is still IN_PROGRESS
      if (session.exhibitionDay.status !== 'IN_PROGRESS') {
        throw new BadRequestException(
          `Cannot register. Exhibition day is currently ${session.exhibitionDay.status}.`,
        );
      }

      // 3. Mark session COMPLETED
      await tx.visitorRegistrationSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
        },
      });

      // 4. Generate unique readable reference
      let readableRef = this.generateReadableRef();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        const existing = await tx.participation.findUnique({
          where: { readableRef },
        });
        if (!existing) {
          isUnique = true;
        } else {
          readableRef = this.generateReadableRef();
          attempts++;
        }
      }

      // 5. Create participation
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

      // Return public confirmation ONLY (Privacy-first: no queue number or prizes revealed)
      return {
        reference: participation.readableRef,
        visitorName: participation.visitorName,
        registeredAt: participation.registeredAt,
        message:
          'Registration successful! Watch the main wheel display for your reference number.',
      };
    });

    // Notify only after commit: displays can now fetch the saved visitor.
    // The event is an invalidation signal, never a broadcast of visitor PII.
    this.realtime.emitQueueUpdated({ reason: 'registered' });
    return confirmation;
  }

  /**
   * Staff Queue query with repeat-visitor analytics.
   */
  async getQueue(query: QueryQueueDto) {
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const offset = Math.max(0, Number(query.offset) || 0);
    const orderDirection = query.order === 'asc' ? 'asc' : 'desc';

    // Get active day
    const activeDay = await this.prisma.exhibitionDay.findFirst({
      where: { status: 'IN_PROGRESS' },
    });

    const whereClause: any = {};
    if (activeDay) {
      whereClause.exhibitionDayId = activeDay.id;
    }

    if (query.status) {
      if (query.status.includes(',')) {
        const statuses = query.status
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean) as any[];
        whereClause.status = { in: statuses };
      } else {
        whereClause.status = query.status as any;
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

    // Aggregate repeat visitor statistics for these items
    const phones = [...new Set(items.map((i) => i.visitorPhone))];

    const [repeatCounts, winCounts] = await Promise.all([
      // Total participations per phone
      this.prisma.participation.groupBy({
        by: ['visitorPhone'],
        where: { visitorPhone: { in: phones } },
        _count: { id: true },
      }),
      // Total wins per phone
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

    const repeatMap = new Map<string, number>();
    for (const r of repeatCounts) {
      repeatMap.set(r.visitorPhone, r._count.id);
    }

    const winMap = new Map<string, number>();
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
        visitorPhoneMasked: PhoneUtils.maskPhone(item.visitorPhone),
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

  /**
   * Get participation by ID.
   */
  async getParticipationById(id: string) {
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
      throw new NotFoundException(`Participation ${id} not found`);
    }

    return p;
  }

  /**
   * Staff selects a participation to step up to the wheel.
   * Exactly ONE participation can be SELECTED or SPINNING per exhibition at a time.
   */
  async selectParticipation(id: string) {
    const participation = await this.getParticipationById(id);

    if (participation.status === 'COMPLETED') {
      throw new BadRequestException('This visitor has already spun the wheel');
    }

    if (participation.status === 'DAY_CLOSED') {
      throw new BadRequestException(
        'This participation was closed with the ended day',
      );
    }

    if (participation.exhibitionDay.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Exhibition day is not active');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert any previously SELECTED participation back to WAITING
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

      // Mark this one SELECTED
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

  /**
   * Staff skips a participation (e.g. visitor absent from booth).
   */
  async skipParticipation(id: string) {
    const participation = await this.getParticipationById(id);

    if (participation.status === 'COMPLETED') {
      throw new BadRequestException(
        'Cannot skip an already completed participation',
      );
    }

    return this.prisma.participation.update({
      where: { id },
      data: { status: 'SKIPPED' },
    });
  }

  /**
   * Staff returns a skipped or selected participation back to WAITING.
   */
  async requeueParticipation(id: string) {
    const participation = await this.getParticipationById(id);

    if (participation.status === 'COMPLETED') {
      throw new BadRequestException(
        'Cannot requeue an already completed participation',
      );
    }

    return this.prisma.participation.update({
      where: { id },
      data: { status: 'WAITING', selectedAt: null },
    });
  }
}
