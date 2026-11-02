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
exports.CreatePriorityListDto = exports.PriorityItemDto = exports.CreateWheelConfigDto = exports.CreateSliceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateSliceDto {
    sliceIndex;
    rewardId;
    isNoWin;
    label;
    backgroundColor;
    textColor;
    iconUrl;
}
exports.CreateSliceDto = CreateSliceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 0,
        description: 'Visual slice index (0 to sliceCount - 1)',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSliceDto.prototype, "sliceIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Referenced Reward ID (optional for NO_WIN)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSliceDto.prototype, "rewardId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSliceDto.prototype, "isNoWin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'iPhone 16' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSliceDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#4F46E5' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSliceDto.prototype, "backgroundColor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#FFFFFF', default: '#FFFFFF' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSliceDto.prototype, "textColor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSliceDto.prototype, "iconUrl", void 0);
class CreateWheelConfigDto {
    name;
    sliceCount;
    slices;
}
exports.CreateWheelConfigDto = CreateWheelConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INFOTEL 2026 12-Slice Wheel Setup' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWheelConfigDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, minimum: 2, maximum: 16, default: 12 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.Max)(16),
    __metadata("design:type", Number)
], CreateWheelConfigDto.prototype, "sliceCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreateSliceDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSliceDto),
    __metadata("design:type", Array)
], CreateWheelConfigDto.prototype, "slices", void 0);
class PriorityItemDto {
    rewardId;
    rank;
}
exports.PriorityItemDto = PriorityItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'reward-uuid' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PriorityItemDto.prototype, "rewardId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, minimum: 1, description: 'Strict rank 1..N' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PriorityItemDto.prototype, "rank", void 0);
class CreatePriorityListDto {
    name;
    items;
}
exports.CreatePriorityListDto = CreatePriorityListDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Peak Hours Morning Ranking' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePriorityListDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PriorityItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PriorityItemDto),
    __metadata("design:type", Array)
], CreatePriorityListDto.prototype, "items", void 0);
//# sourceMappingURL=create-wheel-config.dto.js.map