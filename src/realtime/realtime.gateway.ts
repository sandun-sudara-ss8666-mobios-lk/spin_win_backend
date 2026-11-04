import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (client.handshake.query?.token as string);

      const displaySecret =
        this.configService.get<string>('DISPLAY_SHARED_SECRET') ||
        'mobios-display-secret';

      if (token === displaySecret) {
        // Authenticated display device (Kiosk / Tablet)
        (client as any).clientType = 'DISPLAY';
        this.logger.log(`Socket client connected [DISPLAY]: ${client.id}`);
        return;
      }

      if (token) {
        const payload = this.jwtService.verify(token);
        (client as any).clientType = 'STAFF_USER';
        (client as any).user = payload;
        this.logger.log(
          `Socket client connected [STAFF: ${payload.email}]: ${client.id}`,
        );
        return;
      }

      // Guest / public client
      (client as any).clientType = 'PUBLIC';
      this.logger.log(`Socket client connected [PUBLIC]: ${client.id}`);
    } catch (err: any) {
      this.logger.warn(
        `Socket connection auth error on ${client.id}: ${err.message}`,
      );
      // Allow connection as public client
      (client as any).clientType = 'PUBLIC';
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const room = data?.room;
    if (!room) return { status: 'error', message: 'Room name required' };

    const clientType = (client as any).clientType;

    // Authorization checks for sensitive rooms
    if (room === 'room:qr-display') {
      if (clientType !== 'DISPLAY' && clientType !== 'STAFF_USER') {
        return {
          status: 'forbidden',
          message: 'Unauthorized room subscription',
        };
      }
    }

    if (room === 'room:admin' || room === 'room:staff-queue') {
      if (clientType !== 'STAFF_USER' && clientType !== 'DISPLAY') {
        return {
          status: 'forbidden',
          message: 'Unauthorized room subscription',
        };
      }
    }

    void client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
    return { status: 'ok', room };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    if (data?.room) {
      void client.leave(data.room);
    }
    return { status: 'ok' };
  }

  // --- Broadcaster Methods ---

  emitQrRotated(tokenData: any) {
    if (this.server) {
      this.server.to('room:qr-display').emit('qr:rotated', tokenData);
    }
  }

  emitQueueUpdated(queueData: any) {
    if (this.server) {
      this.server.to('room:wheel').emit('queue:updated', queueData);
      this.server.to('room:staff-queue').emit('queue:updated', queueData);
      this.server.to('room:admin').emit('queue:updated', queueData);
    }
  }

  emitParticipationSelected(participation: any) {
    if (this.server) {
      this.server
        .to('room:wheel')
        .emit('participation:selected', participation);
      this.server
        .to('room:staff-queue')
        .emit('participation:selected', participation);
    }
  }

  emitSpinStarted(spinData: any) {
    if (this.server) {
      this.server.to('room:wheel').emit('spin:started', spinData);
      this.server.to('room:staff-queue').emit('spin:started', spinData);
    }
  }

  emitSpinCompleted(spinData: any) {
    if (this.server) {
      this.server.to('room:wheel').emit('spin:completed', spinData);
      this.server.to('room:staff-queue').emit('spin:completed', spinData);
      this.server.to('room:admin').emit('spin:completed', spinData);
    }
  }

  emitWheelConfigUpdated(configData: any) {
    if (this.server) {
      this.server.to('room:wheel').emit('wheel:config_updated', configData);
      this.server.to('room:admin').emit('wheel:config_updated', configData);
    }
  }

  emitInventoryChanged(inventoryData: any) {
    if (this.server) {
      this.server.to('room:admin').emit('inventory:changed', inventoryData);
    }
  }

  emitDayLifecycleChanged(dayData: any) {
    if (this.server) {
      this.server.to('room:admin').emit('day:lifecycle_changed', dayData);
      this.server.to('room:staff-queue').emit('day:lifecycle_changed', dayData);
      this.server.to('room:wheel').emit('day:lifecycle_changed', dayData);
    }
  }
}
