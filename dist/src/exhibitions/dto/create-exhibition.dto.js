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
exports.UpdateDayDto = exports.CreateExhibitionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateExhibitionDto {
    name;
    description;
    timezone;
    pacingStartTime;
    pacingEndTime;
}
exports.CreateExhibitionDto = CreateExhibitionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MobiOs Spin & Win @ INFOTEL 2026' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateExhibitionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Annual flagship exhibition event', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExhibitionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Asia/Colombo', default: 'Asia/Colombo' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExhibitionDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00:00', default: '09:00:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExhibitionDto.prototype, "pacingStartTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '21:00:00', default: '21:00:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExhibitionDto.prototype, "pacingEndTime", void 0);
class UpdateDayDto {
    label;
    pacingStartTime;
    pacingEndTime;
}
exports.UpdateDayDto = UpdateDayDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Day 1 - November 6', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDayDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00:00', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDayDto.prototype, "pacingStartTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '21:00:00', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDayDto.prototype, "pacingEndTime", void 0);
//# sourceMappingURL=create-exhibition.dto.js.map