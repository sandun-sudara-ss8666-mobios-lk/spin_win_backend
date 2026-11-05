import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { ExhibitionsModule } from './exhibitions/exhibitions.module';
import { QrModule } from './qr/qr.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { MerchantsModule } from './merchants/merchants.module';
import { RewardsModule } from './rewards/rewards.module';
import { WheelModule } from './wheel/wheel.module';
import { SpinsModule } from './spins/spins.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ReportsModule } from './reports/reports.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    CommonModule,
    AuditModule,
    AuthModule,
    ExhibitionsModule,
    QrModule,
    RegistrationsModule,
    MerchantsModule,
    RewardsModule,
    WheelModule,
    SpinsModule,
    RealtimeModule,
    ReportsModule,
  ],
})
export class AppModule {}
