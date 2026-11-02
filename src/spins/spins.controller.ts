import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { SpinsService } from './spins.service';
import { ExecuteSpinDto } from './dto/execute-spin.dto';
import { DisplayTokenGuard } from '../auth/guards/display-token.guard';

@ApiTags('Wheel Spin Engine')
@Controller('spins')
export class SpinsController {
  constructor(private readonly spinsService: SpinsService) {}

  @Post('execute')
  @UseGuards(DisplayTokenGuard)
  @ApiHeader({
    name: 'x-display-token',
    description: 'Wheel Screen Display Token or Staff JWT',
  })
  @ApiOperation({
    summary:
      'Authoritatively execute spin for selected participation (atomic transaction, idempotency protected)',
  })
  @ApiResponse({
    status: 200,
    description: 'Spin outcome committed and returned',
  })
  @ApiResponse({
    status: 400,
    description: 'Participation not in SELECTED state or exhibition paused',
  })
  @ApiResponse({
    status: 409,
    description: 'Concurrency contention or invalid spin state',
  })
  async executeSpin(@Body() dto: ExecuteSpinDto) {
    return this.spinsService.executeSpin(dto);
  }

  @Get('participation/:id')
  @ApiOperation({
    summary:
      'Crash recovery endpoint: retrieve committed spin result for participation',
  })
  async getByParticipation(@Param('id') participationId: string) {
    return this.spinsService.getSpinByParticipationId(participationId);
  }
}
