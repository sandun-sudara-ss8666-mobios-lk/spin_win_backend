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
exports.QueryQueueDto = exports.RegisterVisitorDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterVisitorDto {
    sessionToken;
    name;
    phone;
}
exports.RegisterVisitorDto = RegisterVisitorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'REG_8f142c94d12a63',
        description: 'Session token issued upon claiming QR',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterVisitorDto.prototype, "sessionToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Kamal Perera', description: 'Visitor full name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterVisitorDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '0771234567',
        description: 'Sri Lankan mobile number',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterVisitorDto.prototype, "phone", void 0);
class QueryQueueDto {
    status;
    limit;
    offset;
    order;
    search;
}
exports.QueryQueueDto = QueryQueueDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: [
            'WAITING',
            'SELECTED',
            'SPINNING',
            'COMPLETED',
            'SKIPPED',
            'DAY_CLOSED',
        ],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryQueueDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 50 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryQueueDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryQueueDto.prototype, "offset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['desc', 'asc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryQueueDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Search by reference code or visitor name or phone',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryQueueDto.prototype, "search", void 0);
//# sourceMappingURL=register-visitor.dto.js.map