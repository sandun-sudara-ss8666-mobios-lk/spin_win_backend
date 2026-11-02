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
exports.RegistrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const registrations_service_1 = require("./registrations.service");
const register_visitor_dto_1 = require("./dto/register-visitor.dto");
const staff_or_display_guard_1 = require("../auth/guards/staff-or-display.guard");
let RegistrationsController = class RegistrationsController {
    registrationsService;
    constructor(registrationsService) {
        this.registrationsService = registrationsService;
    }
    async register(dto) {
        return this.registrationsService.registerVisitor(dto);
    }
    async getQueue(query) {
        return this.registrationsService.getQueue(query);
    }
    async getById(id) {
        return this.registrationsService.getParticipationById(id);
    }
    async select(id) {
        return this.registrationsService.selectParticipation(id);
    }
    async skip(id) {
        return this.registrationsService.skipParticipation(id);
    }
    async requeue(id) {
        return this.registrationsService.requeueParticipation(id);
    }
};
exports.RegistrationsController = RegistrationsController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'Public endpoint: Visitor submits name & Sri Lankan phone with claimed session token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Registration confirmed; returns reference number',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid phone or session expired' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_visitor_dto_1.RegisterVisitorDto]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('queue'),
    (0, common_1.UseGuards)(staff_or_display_guard_1.StaffOrDisplayGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Staff & Display endpoint: Get active day queue (newest first) with repeat visitor statistics',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_visitor_dto_1.QueryQueueDto]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(staff_or_display_guard_1.StaffOrDisplayGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Staff endpoint: Get participation details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(':id/select'),
    (0, common_1.UseGuards)(staff_or_display_guard_1.StaffOrDisplayGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Staff selects a visitor to step up to the wheel (exactly one selected at a time)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "select", null);
__decorate([
    (0, common_1.Post)(':id/skip'),
    (0, common_1.UseGuards)(staff_or_display_guard_1.StaffOrDisplayGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Staff marks visitor as skipped (not present at booth)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "skip", null);
__decorate([
    (0, common_1.Post)(':id/requeue'),
    (0, common_1.UseGuards)(staff_or_display_guard_1.StaffOrDisplayGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Staff returns skipped or selected visitor back to WAITING status',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "requeue", null);
exports.RegistrationsController = RegistrationsController = __decorate([
    (0, swagger_1.ApiTags)('Visitor Registrations & Wheel Queue'),
    (0, common_1.Controller)('participations'),
    __metadata("design:paramtypes", [registrations_service_1.RegistrationsService])
], RegistrationsController);
//# sourceMappingURL=registrations.controller.js.map