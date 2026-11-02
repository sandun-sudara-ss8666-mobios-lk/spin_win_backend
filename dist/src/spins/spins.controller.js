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
exports.SpinsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const spins_service_1 = require("./spins.service");
const execute_spin_dto_1 = require("./dto/execute-spin.dto");
const display_token_guard_1 = require("../auth/guards/display-token.guard");
let SpinsController = class SpinsController {
    spinsService;
    constructor(spinsService) {
        this.spinsService = spinsService;
    }
    async executeSpin(dto) {
        return this.spinsService.executeSpin(dto);
    }
    async getByParticipation(participationId) {
        return this.spinsService.getSpinByParticipationId(participationId);
    }
};
exports.SpinsController = SpinsController;
__decorate([
    (0, common_1.Post)('execute'),
    (0, common_1.UseGuards)(display_token_guard_1.DisplayTokenGuard),
    (0, swagger_1.ApiHeader)({
        name: 'x-display-token',
        description: 'Wheel Screen Display Token or Staff JWT',
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Authoritatively execute spin for selected participation (atomic transaction, idempotency protected)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Spin outcome committed and returned',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Participation not in SELECTED state or exhibition paused',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Concurrency contention or invalid spin state',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [execute_spin_dto_1.ExecuteSpinDto]),
    __metadata("design:returntype", Promise)
], SpinsController.prototype, "executeSpin", null);
__decorate([
    (0, common_1.Get)('participation/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Crash recovery endpoint: retrieve committed spin result for participation',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpinsController.prototype, "getByParticipation", null);
exports.SpinsController = SpinsController = __decorate([
    (0, swagger_1.ApiTags)('Wheel Spin Engine'),
    (0, common_1.Controller)('spins'),
    __metadata("design:paramtypes", [spins_service_1.SpinsService])
], SpinsController);
//# sourceMappingURL=spins.controller.js.map