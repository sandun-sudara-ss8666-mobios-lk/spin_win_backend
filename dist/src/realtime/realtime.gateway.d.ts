import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, data: {
        room: string;
    }): {
        status: string;
        message: string;
        room?: undefined;
    } | {
        status: string;
        room: string;
        message?: undefined;
    };
    handleUnsubscribe(client: Socket, data: {
        room: string;
    }): {
        status: string;
    };
    emitQrRotated(tokenData: any): void;
    emitQueueUpdated(queueData: any): void;
    emitParticipationSelected(participation: any): void;
    emitSpinStarted(spinData: any): void;
    emitSpinCompleted(spinData: any): void;
    emitWheelConfigUpdated(configData: any): void;
    emitInventoryChanged(inventoryData: any): void;
    emitDayLifecycleChanged(dayData: any): void;
}
