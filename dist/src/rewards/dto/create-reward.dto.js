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
exports.CancelAwardDto = exports.CancellationResolutionEnum = exports.AdjustStockDto = exports.UpdateRewardDto = exports.CreateRewardDto = exports.DistributionStrategyEnum = exports.InventoryModeEnum = exports.RewardTypeEnum = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var RewardTypeEnum;
(function (RewardTypeEnum) {
    RewardTypeEnum["PHYSICAL"] = "PHYSICAL";
    RewardTypeEnum["VOUCHER"] = "VOUCHER";
    RewardTypeEnum["MERCHANDISE"] = "MERCHANDISE";
    RewardTypeEnum["NO_WIN"] = "NO_WIN";
})(RewardTypeEnum || (exports.RewardTypeEnum = RewardTypeEnum = {}));
var InventoryModeEnum;
(function (InventoryModeEnum) {
    InventoryModeEnum["LIMITED"] = "LIMITED";
    InventoryModeEnum["UNLIMITED"] = "UNLIMITED";
    InventoryModeEnum["NO_WIN"] = "NO_WIN";
})(InventoryModeEnum || (exports.InventoryModeEnum = InventoryModeEnum = {}));
var DistributionStrategyEnum;
(function (DistributionStrategyEnum) {
    DistributionStrategyEnum["EXHIBITION_WIDE"] = "EXHIBITION_WIDE";
    DistributionStrategyEnum["AUTO_DAILY"] = "AUTO_DAILY";
    DistributionStrategyEnum["CUSTOM_DAILY"] = "CUSTOM_DAILY";
})(DistributionStrategyEnum || (exports.DistributionStrategyEnum = DistributionStrategyEnum = {}));
class CreateRewardDto {
    merchantId;
    name;
    description;
    type;
    shortLabel;
    inventoryMode;
    distributionStrategy;
    totalPhysicalStock;
    carryForward;
    baselineWeight;
    colorHex;
    iconUrl;
    customDailyAllocations;
}
exports.CreateRewardDto = CreateRewardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Sponsoring Merchant ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "merchantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Samsung Galaxy Fit 3' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Smart fitness tracker with AMOLED display',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: RewardTypeEnum, default: RewardTypeEnum.PHYSICAL }),
    (0, class_validator_1.IsEnum)(RewardTypeEnum),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Galaxy Fit 3',
        maxLength: 24,
        description: 'Short label for wheel slice',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(24),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "shortLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: InventoryModeEnum, default: InventoryModeEnum.LIMITED }),
    (0, class_validator_1.IsEnum)(InventoryModeEnum),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "inventoryMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: DistributionStrategyEnum,
        default: DistributionStrategyEnum.AUTO_DAILY,
    }),
    (0, class_validator_1.IsEnum)(DistributionStrategyEnum),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "distributionStrategy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 30,
        description: 'Total physical inventory count (required for LIMITED rewards)',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRewardDto.prototype, "totalPhysicalStock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        default: true,
        description: 'Carry forward unused daily quota to next day',
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateRewardDto.prototype, "carryForward", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 3,
        default: 3,
        description: 'Baseline selection weight (1=Low, 3=Medium, 5=High)',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateRewardDto.prototype, "baselineWeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#4F46E5', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "colorHex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRewardDto.prototype, "iconUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Custom day allocations if CUSTOM_DAILY: { [dayId]: quantity }',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateRewardDto.prototype, "customDailyAllocations", void 0);
class UpdateRewardDto {
    name;
    description;
    shortLabel;
    carryForward;
    baselineWeight;
    colorHex;
    iconUrl;
    isActive;
}
exports.UpdateRewardDto = UpdateRewardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRewardDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRewardDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(24),
    __metadata("design:type", String)
], UpdateRewardDto.prototype, "shortLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRewardDto.prototype, "carryForward", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateRewardDto.prototype, "baselineWeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRewardDto.prototype, "colorHex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRewardDto.prototype, "iconUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRewardDto.prototype, "isActive", void 0);
class AdjustStockDto {
    quantityDelta;
    notes;
}
exports.AdjustStockDto = AdjustStockDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 10,
        description: 'Stock change delta (positive to add, negative to reduce safely)',
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "quantityDelta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Added supplementary booth inventory from warehouse',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "notes", void 0);
var CancellationResolutionEnum;
(function (CancellationResolutionEnum) {
    CancellationResolutionEnum["IMMEDIATE_RETURN"] = "IMMEDIATE_RETURN";
    CancellationResolutionEnum["RETURN_TO_PACING"] = "RETURN_TO_PACING";
    CancellationResolutionEnum["RETIRE"] = "RETIRE";
})(CancellationResolutionEnum || (exports.CancellationResolutionEnum = CancellationResolutionEnum = {}));
class CancelAwardDto {
    resolution;
    reason;
}
exports.CancelAwardDto = CancelAwardDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: CancellationResolutionEnum,
        description: 'How to handle stock upon cancellation',
        example: CancellationResolutionEnum.IMMEDIATE_RETURN,
    }),
    (0, class_validator_1.IsEnum)(CancellationResolutionEnum),
    __metadata("design:type", String)
], CancelAwardDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Visitor did not collect voucher within 30 minutes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelAwardDto.prototype, "reason", void 0);
//# sourceMappingURL=create-reward.dto.js.map