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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const qr_service_1 = require("./qr.service");
const display_token_guard_1 = require("../auth/guards/display-token.guard");
let QrController = class QrController {
    qrService;
    constructor(qrService) {
        this.qrService = qrService;
    }
    async getCurrentToken() {
        return this.qrService.getCurrentOrNewToken();
    }
    async rotateToken() {
        return this.qrService.generateRotatingToken();
    }
    async verifyToken(token) {
        return this.qrService.verifyToken(token);
    }
    async claimToken(token, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        return this.qrService.claimToken(token, ipAddress);
    }
};
exports.QrController = QrController;
__decorate([
    (0, common_1.Get)('current'),
    (0, common_1.UseGuards)(display_token_guard_1.DisplayTokenGuard),
    (0, swagger_1.ApiHeader)({
        name: 'x-display-token',
        description: 'Staff Display Screen Shared Secret Token',
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get or generate the current rotating QR token for authenticated display screens',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QrController.prototype, "getCurrentToken", null);
__decorate([
    (0, common_1.Post)('rotate'),
    (0, common_1.UseGuards)(display_token_guard_1.DisplayTokenGuard),
    (0, swagger_1.ApiHeader)({
        name: 'x-display-token',
        description: 'Staff Display Screen Shared Secret Token',
    }),
    (0, swagger_1.ApiOperation)({ summary: 'Explicitly rotate QR code (~15s cadence)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QrController.prototype, "rotateToken", null);
__decorate([
    (0, common_1.Get)('verify/:token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Public endpoint: verify scanned QR token validity before visitor claims',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token status and validity' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Token not found' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QrController.prototype, "verifyToken", null);
__decorate([
    (0, common_1.Post)('claim/:token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Public endpoint: Visitor taps "Continue to Register" -> atomically consumes token and creates registration session',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Token claimed; returns registration session token valid for 5 min',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Token already claimed by another visitor',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Token expired' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QrController.prototype, "claimToken", null);
exports.QrController = QrController = __decorate([
    (0, swagger_1.ApiTags)('QR Display & Visitor Claim'),
    (0, common_1.Controller)('qr'),
    __metadata("design:paramtypes", [qr_service_1.QrService])
], QrController);
//# sourceMappingURL=qr.controller.js.map