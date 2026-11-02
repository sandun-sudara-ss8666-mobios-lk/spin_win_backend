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
exports.ExhibitionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exhibitions_service_1 = require("./exhibitions.service");
const create_exhibition_dto_1 = require("./dto/create-exhibition.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ExhibitionsController = class ExhibitionsController {
    exhibitionsService;
    constructor(exhibitionsService) {
        this.exhibitionsService = exhibitionsService;
    }
    async getCurrentExhibition() {
        return this.exhibitionsService.getActiveExhibition();
    }
    async getActiveDay() {
        return this.exhibitionsService.getActiveDay();
    }
    async getDayById(dayId) {
        return this.exhibitionsService.getDayById(dayId);
    }
    async startDay(dayId, userId, userEmail) {
        return this.exhibitionsService.startDay(dayId, userId, userEmail);
    }
    async endDay(dayId, userId, userEmail) {
        return this.exhibitionsService.endDay(dayId, userId, userEmail);
    }
    async updateDay(dayId, dto, userId, userEmail) {
        return this.exhibitionsService.updateDay(dayId, dto, userId, userEmail);
    }
    async pauseExhibition(exhibitionId, userId, userEmail) {
        return this.exhibitionsService.setPauseStatus(exhibitionId, true, userId, userEmail);
    }
    async resumeExhibition(exhibitionId, userId, userEmail) {
        return this.exhibitionsService.setPauseStatus(exhibitionId, false, userId, userEmail);
    }
};
exports.ExhibitionsController = ExhibitionsController;
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active exhibition details, settings, and day cards',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "getCurrentExhibition", null);
__decorate([
    (0, common_1.Get)('days/active'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get currently active exhibition day (status IN_PROGRESS) or null',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "getActiveDay", null);
__decorate([
    (0, common_1.Get)('days/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific exhibition day details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "getDayById", null);
__decorate([
    (0, common_1.Post)('days/:id/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually start an exhibition day (requires confirmation)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Day started successfully' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Day completed or another day is already active',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "startDay", null);
__decorate([
    (0, common_1.Post)('days/:id/end'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually end an exhibition day, closing waiting queue and finalizing carry-forward',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Day ended successfully' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'In-flight spin must be resolved before ending day',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "endDay", null);
__decorate([
    (0, common_1.Patch)('days/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Update exhibition day parameters (label, pacing hours)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_exhibition_dto_1.UpdateDayDto, String, String]),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "updateDay", null);
__decorate([
    (0, common_1.Post)(':id/pause'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually pause exhibition activities (spins paused, registrations allowed)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "pauseExhibition", null);
__decorate([
    (0, common_1.Post)(':id/resume'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Resume previously paused exhibition activities' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExhibitionsController.prototype, "resumeExhibition", null);
exports.ExhibitionsController = ExhibitionsController = __decorate([
    (0, swagger_1.ApiTags)('Exhibitions & Day Lifecycle'),
    (0, common_1.Controller)('exhibitions'),
    __metadata("design:paramtypes", [exhibitions_service_1.ExhibitionsService])
], ExhibitionsController);
//# sourceMappingURL=exhibitions.controller.js.map