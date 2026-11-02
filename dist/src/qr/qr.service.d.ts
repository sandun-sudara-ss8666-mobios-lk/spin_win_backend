import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class QrService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly tokenTtlSeconds;
    private readonly regSessionTtlMinutes;
    constructor(prisma: PrismaService, configService: ConfigService);
    generateRotatingToken(): Promise<{
        token: string;
        expiresAt: Date;
        ttlSeconds: number;
        dayNumber: number;
        dayLabel: string;
    }>;
    getCurrentOrNewToken(): Promise<{
        token: string;
        expiresAt: Date;
        ttlSeconds: number;
        dayNumber: number;
        dayLabel: string;
    }>;
    verifyToken(token: string): Promise<{
        token: string;
        isValid: boolean;
        status: import(".prisma/client").$Enums.QrTokenStatus;
        isExpired: boolean;
        dayNumber: number;
        dayLabel: string;
    }>;
    claimToken(token: string, ipAddress?: string): Promise<{
        sessionToken: string;
        expiresAt: Date;
        dayId: string;
        dayNumber: number;
        dayLabel: string;
    }>;
}
