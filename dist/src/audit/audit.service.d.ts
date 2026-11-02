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
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(dto: AuditLogDto): Promise<{
        id: string;
        createdAt: Date;
        userEmail: string | null;
        action: string;
        resourceType: string;
        resourceId: string | null;
        payload: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string | null;
    } | undefined>;
    findRecent(limit?: number, action?: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userEmail: string | null;
        action: string;
        resourceType: string;
        resourceId: string | null;
        payload: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string | null;
    })[]>;
}
