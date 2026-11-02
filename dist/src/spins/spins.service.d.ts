import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ExecuteSpinDto } from './dto/execute-spin.dto';
export declare class SpinsService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    executeSpin(dto: ExecuteSpinDto): Promise<{
        spinId: any;
        participationId: any;
        readableRef: any;
        visitorName: any;
        sliceIndex: any;
        sliceLabel: any;
        isWin: any;
        reward: {
            id: any;
            name: any;
            shortLabel: any;
            type: any;
            colorHex: any;
            iconUrl: any;
        } | null;
        completedAt: any;
        isReplay: boolean;
    }>;
    getSpinByParticipationId(participationId: string): Promise<{
        spinId: any;
        participationId: any;
        readableRef: any;
        visitorName: any;
        sliceIndex: any;
        sliceLabel: any;
        isWin: any;
        reward: {
            id: any;
            name: any;
            shortLabel: any;
            type: any;
            colorHex: any;
            iconUrl: any;
        } | null;
        completedAt: any;
        isReplay: boolean;
    }>;
    private formatSpinResponse;
}
