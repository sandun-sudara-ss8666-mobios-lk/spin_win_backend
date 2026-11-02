import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { RegisterVisitorDto, QueryQueueDto } from './dto/register-visitor.dto';
import { StaffOrDisplayGuard } from '../auth/guards/staff-or-display.guard';

@ApiTags('Visitor Registrations & Wheel Queue')
@Controller('participations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('register')
  @ApiOperation({
    summary:
      'Public endpoint: Visitor submits name & Sri Lankan phone with claimed session token',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration confirmed; returns reference number',
  })
  @ApiResponse({ status: 400, description: 'Invalid phone or session expired' })
  async register(@Body() dto: RegisterVisitorDto) {
    return this.registrationsService.registerVisitor(dto);
  }

  @Get('queue')
  @UseGuards(StaffOrDisplayGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Staff & Display endpoint: Get active day queue (newest first) with repeat visitor statistics',
  })
  async getQueue(@Query() query: QueryQueueDto) {
    return this.registrationsService.getQueue(query);
  }

  @Get(':id')
  @UseGuards(StaffOrDisplayGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff endpoint: Get participation details by ID' })
  async getById(@Param('id') id: string) {
    return this.registrationsService.getParticipationById(id);
  }

  @Post(':id/select')
  @UseGuards(StaffOrDisplayGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Staff selects a visitor to step up to the wheel (exactly one selected at a time)',
  })
  async select(@Param('id') id: string) {
    return this.registrationsService.selectParticipation(id);
  }

  @Post(':id/skip')
  @UseGuards(StaffOrDisplayGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Staff marks visitor as skipped (not present at booth)',
  })
  async skip(@Param('id') id: string) {
    return this.registrationsService.skipParticipation(id);
  }

  @Post(':id/requeue')
  @UseGuards(StaffOrDisplayGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Staff returns skipped or selected visitor back to WAITING status',
  })
  async requeue(@Param('id') id: string) {
    return this.registrationsService.requeueParticipation(id);
  }
}
