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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffOrDisplayGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let StaffOrDisplayGuard = class StaffOrDisplayGuard {
    configService;
    jwtService;
    constructor(configService, jwtService) {
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const tokenHeader = request.headers['x-display-token'];
        const tokenQuery = request.query?.display_token;
        const expectedSecret = this.configService.get('DISPLAY_SHARED_SECRET') ||
            'mobios-display-screen-auth-token-key-2026';
        const displayToken = tokenHeader || tokenQuery;
        if (displayToken && displayToken === expectedSecret) {
            request.isDisplayClient = true;
            return true;
        }
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const jwtToken = authHeader.substring(7);
            try {
                const secret = this.configService.get('JWT_SECRET') ||
                    'mobios-jwt-secret-key-2026';
                const payload = this.jwtService.verify(jwtToken, { secret });
                request.user = payload;
                return true;
            }
            catch {
                throw new common_1.UnauthorizedException('Invalid or expired authentication token');
            }
        }
        throw new common_1.UnauthorizedException('Valid display token or staff authentication required');
    }
};
exports.StaffOrDisplayGuard = StaffOrDisplayGuard;
exports.StaffOrDisplayGuard = StaffOrDisplayGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService])
], StaffOrDisplayGuard);
//# sourceMappingURL=staff-or-display.guard.js.map