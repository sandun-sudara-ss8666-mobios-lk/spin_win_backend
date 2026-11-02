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
exports.RewardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rewards_service_1 = require("./rewards.service");
const create_reward_dto_1 = require("./dto/create-reward.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let RewardsController = class RewardsController {
    rewardsService;
    constructor(rewardsService) {
        this.rewardsService = rewardsService;
    }
    async create(dto, userId, userEmail) {
        return this.rewardsService.create(dto, userId, userEmail);
    }
    async findAll(all) {
        return this.rewardsService.findAll(all !== 'true');
    }
    async getAwards(dayId) {
        return this.rewardsService.getAwards(dayId);
    }
    async findOne(id) {
        return this.rewardsService.findOne(id);
    }
    async update(id, dto, userId, userEmail) {
        return this.rewardsService.update(id, dto, userId, userEmail);
    }
    async adjustStock(id, dto, userId, userEmail) {
        return this.rewardsService.adjustStock(id, dto, userId, userEmail);
    }
    async cancelAward(awardId, dto, userId, userEmail) {
        return this.rewardsService.cancelAward(awardId, dto, userId, userEmail);
    }
};
exports.RewardsController = RewardsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new reward with stock distribution strategy',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reward_dto_1.CreateRewardDto, String, String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all rewards with stock & daily allocation summaries',
    }),
    __param(0, (0, common_1.Query)('all')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('awards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List committed awards with optional day filter' }),
    __param(0, (0, common_1.Query)('dayId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "getAwards", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get single reward with ledger history & daily allocations',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update reward metadata' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_reward_dto_1.UpdateRewardDto, String, String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/adjust-stock'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Adjust physical stock safely with audit ledger entry (prevents dropping below awarded count)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_reward_dto_1.AdjustStockDto, String, String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Post)('awards/:id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Staff cancels an uncollected award (IMMEDIATE_RETURN, RETURN_TO_PACING, or RETIRE)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Award cancelled successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_reward_dto_1.CancelAwardDto, String, String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "cancelAward", null);
exports.RewardsController = RewardsController = __decorate([
    (0, swagger_1.ApiTags)('Rewards & Inventory Management'),
    (0, common_1.Controller)('rewards'),
    __metadata("design:paramtypes", [rewards_service_1.RewardsService])
], RewardsController);
//# sourceMappingURL=rewards.controller.js.map