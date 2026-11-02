import { QrService } from './qr.service';
export declare class QrController {
    private readonly qrService;
    constructor(qrService: QrService);
    getCurrentToken(): Promise<{
        token: string;
        expiresAt: Date;
        ttlSeconds: number;
        dayNumber: number;
        dayLabel: string;
    }>;
    rotateToken(): Promise<{
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
    claimToken(token: string, req: any): Promise<{
        sessionToken: string;
        expiresAt: Date;
        dayId: string;
        dayNumber: number;
        dayLabel: string;
    }>;
}
