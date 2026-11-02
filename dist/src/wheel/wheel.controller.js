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
exports.WheelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wheel_service_1 = require("./wheel.service");
const create_wheel_config_dto_1 = require("./dto/create-wheel-config.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let WheelController = class WheelController {
    wheelService;
    constructor(wheelService) {
        this.wheelService = wheelService;
    }
    async getActiveWheel() {
        return this.wheelService.getActiveWheelDisplayConfig();
    }
    async getProbabilityPreview() {
        return this.wheelService.getProbabilityPreview();
    }
    async getAllConfigs() {
        return this.wheelService.getAllConfigs();
    }
    async createConfig(dto, userId, userEmail) {
        return this.wheelService.createDraftConfig(dto, userId, userEmail);
    }
    async publishConfig(configId, userId, userEmail) {
        return this.wheelService.publishConfig(configId, userId, userEmail);
    }
    async getAllPriorityLists() {
        return this.wheelService.getAllPriorityLists();
    }
    async createPriorityList(dto, userId, userEmail) {
        return this.wheelService.createPriorityList(dto, userId, userEmail);
    }
    async publishPriorityList(id, userId, userEmail) {
        return this.wheelService.publishPriorityList(id, userId, userEmail);
    }
    async deactivatePriorityList(id, userId, userEmail) {
        return this.wheelService.deactivatePriorityList(id, userId, userEmail);
    }
};
exports.WheelController = WheelController;
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({
        summary: 'Public/Kiosk endpoint: returns active published wheel visual configuration (no odds or stock leaked)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getActiveWheel", null);
__decorate([
    (0, common_1.Get)('probability-preview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Admin preview: dynamic probabilities of all slices evaluated against current pacing and active priority curve',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getProbabilityPreview", null);
__decorate([
    (0, common_1.Get)('configs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all wheel configurations (drafts and published)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getAllConfigs", null);
__decorate([
    (0, common_1.Post)('configs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a draft wheel configuration with 2-16 slices',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_wheel_config_dto_1.CreateWheelConfigDto, String, String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "createConfig", null);
__decorate([
    (0, common_1.Post)('configs/:id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Publish wheel configuration (strictly validates presence of fallback UNLIMITED or NO_WIN outcome)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wheel configuration published' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing fallback outcome' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "publishConfig", null);
__decorate([
    (0, common_1.Get)('priority-lists'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all priority ranking lists' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getAllPriorityLists", null);
__decorate([
    (0, common_1.Post)('priority-lists'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a draft priority list ranking a subset of rewards 1..N strictly',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_wheel_config_dto_1.CreatePriorityListDto, String, String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "createPriorityList", null);
__decorate([
    (0, common_1.Post)('priority-lists/:id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Publish priority list to apply monotonic ranking curve to live spins',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "publishPriorityList", null);
__decorate([
    (0, common_1.Post)('priority-lists/:id/deactivate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Deactivate priority list and revert to baseline weights',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "deactivatePriorityList", null);
exports.WheelController = WheelController = __decorate([
    (0, swagger_1.ApiTags)('Wheel Configuration & Priority Ranking'),
    (0, common_1.Controller)('wheel'),
    __metadata("design:paramtypes", [wheel_service_1.WheelService])
], WheelController);
//# sourceMappingURL=wheel.controller.js.map