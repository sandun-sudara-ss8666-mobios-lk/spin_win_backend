import { Module } from '@nestjs/common';
import { SpinsService } from './spins.service';
import { SpinsController } from './spins.controller';

@Module({
  controllers: [SpinsController],
  providers: [SpinsService],
  exports: [SpinsService],
})
export class SpinsModule {}
