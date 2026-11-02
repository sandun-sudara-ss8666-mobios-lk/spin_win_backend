"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const common_module_1 = require("./common/common.module");
const audit_module_1 = require("./audit/audit.module");
const auth_module_1 = require("./auth/auth.module");
const exhibitions_module_1 = require("./exhibitions/exhibitions.module");
const qr_module_1 = require("./qr/qr.module");
const registrations_module_1 = require("./registrations/registrations.module");
const merchants_module_1 = require("./merchants/merchants.module");
const rewards_module_1 = require("./rewards/rewards.module");
const wheel_module_1 = require("./wheel/wheel.module");
const spins_module_1 = require("./spins/spins.module");
const realtime_module_1 = require("./realtime/realtime.module");
const reports_module_1 = require("./reports/reports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 120,
                },
            ]),
            common_module_1.CommonModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            exhibitions_module_1.ExhibitionsModule,
            qr_module_1.QrModule,
            registrations_module_1.RegistrationsModule,
            merchants_module_1.MerchantsModule,
            rewards_module_1.RewardsModule,
            wheel_module_1.WheelModule,
            spins_module_1.SpinsModule,
            realtime_module_1.RealtimeModule,
            reports_module_1.ReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map