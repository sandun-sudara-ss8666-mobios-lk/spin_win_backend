"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinsModule = void 0;
const common_1 = require("@nestjs/common");
const spins_service_1 = require("./spins.service");
const spins_controller_1 = require("./spins.controller");
let SpinsModule = class SpinsModule {
};
exports.SpinsModule = SpinsModule;
exports.SpinsModule = SpinsModule = __decorate([
    (0, common_1.Module)({
        controllers: [spins_controller_1.SpinsController],
        providers: [spins_service_1.SpinsService],
        exports: [spins_service_1.SpinsService],
    })
], SpinsModule);
//# sourceMappingURL=spins.module.js.map