"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    jwtService;
    configService;
    server;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                client.handshake.query?.token;
            const displaySecret = this.configService.get('DISPLAY_SHARED_SECRET') ||
                'mobios-display-secret';
            if (token === displaySecret) {
                client.clientType = 'DISPLAY';
                this.logger.log(`Socket client connected [DISPLAY]: ${client.id}`);
                return;
            }
            if (token) {
                const payload = this.jwtService.verify(token);
                client.clientType = 'STAFF_USER';
                client.user = payload;
                this.logger.log(`Socket client connected [STAFF: ${payload.email}]: ${client.id}`);
                return;
            }
            client.clientType = 'PUBLIC';
            this.logger.log(`Socket client connected [PUBLIC]: ${client.id}`);
        }
        catch (err) {
            this.logger.warn(`Socket connection auth error on ${client.id}: ${err.message}`);
            client.clientType = 'PUBLIC';
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Socket client disconnected: ${client.id}`);
    }
    handleSubscribe(client, data) {
        const room = data?.room;
        if (!room)
            return { status: 'error', message: 'Room name required' };
        const clientType = client.clientType;
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
    handleUnsubscribe(client, data) {
        if (data?.room) {
            void client.leave(data.room);
        }
        return { status: 'ok' };
    }
    emitQrRotated(tokenData) {
        if (this.server) {
            this.server.to('room:qr-display').emit('qr:rotated', tokenData);
        }
    }
    emitQueueUpdated(queueData) {
        if (this.server) {
            this.server.to('room:staff-queue').emit('queue:updated', queueData);
            this.server.to('room:admin').emit('queue:updated', queueData);
        }
    }
    emitParticipationSelected(participation) {
        if (this.server) {
            this.server
                .to('room:wheel')
                .emit('participation:selected', participation);
            this.server
                .to('room:staff-queue')
                .emit('participation:selected', participation);
        }
    }
    emitSpinStarted(spinData) {
        if (this.server) {
            this.server.to('room:wheel').emit('spin:started', spinData);
            this.server.to('room:staff-queue').emit('spin:started', spinData);
        }
    }
    emitSpinCompleted(spinData) {
        if (this.server) {
            this.server.to('room:wheel').emit('spin:completed', spinData);
            this.server.to('room:staff-queue').emit('spin:completed', spinData);
            this.server.to('room:admin').emit('spin:completed', spinData);
        }
    }
    emitWheelConfigUpdated(configData) {
        if (this.server) {
            this.server.to('room:wheel').emit('wheel:config_updated', configData);
            this.server.to('room:admin').emit('wheel:config_updated', configData);
        }
    }
    emitInventoryChanged(inventoryData) {
        if (this.server) {
            this.server.to('room:admin').emit('inventory:changed', inventoryData);
        }
    }
    emitDayLifecycleChanged(dayData) {
        if (this.server) {
            this.server.to('room:admin').emit('day:lifecycle_changed', dayData);
            this.server.to('room:staff-queue').emit('day:lifecycle_changed', dayData);
            this.server.to('room:wheel').emit('day:lifecycle_changed', dayData);
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribe", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/events',
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map