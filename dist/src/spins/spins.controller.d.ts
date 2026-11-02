import { SpinsService } from './spins.service';
import { ExecuteSpinDto } from './dto/execute-spin.dto';
export declare class SpinsController {
    private readonly spinsService;
    constructor(spinsService: SpinsService);
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
    getByParticipation(participationId: string): Promise<{
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
}
