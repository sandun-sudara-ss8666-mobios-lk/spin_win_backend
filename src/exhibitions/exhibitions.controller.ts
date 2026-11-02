import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ExhibitionsService } from './exhibitions.service';
import { UpdateDayDto } from './dto/create-exhibition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Exhibitions & Day Lifecycle')
@Controller('exhibitions')
export class ExhibitionsController {
  constructor(private readonly exhibitionsService: ExhibitionsService) {}

  @Get('current')
  @ApiOperation({
    summary: 'Get active exhibition details, settings, and day cards',
  })
  async getCurrentExhibition() {
    return this.exhibitionsService.getActiveExhibition();
  }

  @Get('days/active')
  @ApiOperation({
    summary: 'Get currently active exhibition day (status IN_PROGRESS) or null',
  })
  async getActiveDay() {
    return this.exhibitionsService.getActiveDay();
  }

  @Get('days/:id')
  @ApiOperation({ summary: 'Get specific exhibition day details by ID' })
  async getDayById(@Param('id') dayId: string) {
    return this.exhibitionsService.getDayById(dayId);
  }

  @Post('days/:id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Manually start an exhibition day (requires confirmation)',
  })
  @ApiResponse({ status: 200, description: 'Day started successfully' })
  @ApiResponse({
    status: 400,
    description: 'Day completed or another day is already active',
  })
  async startDay(
    @Param('id') dayId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.exhibitionsService.startDay(dayId, userId, userEmail);
  }

  @Post('days/:id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Manually end an exhibition day, closing waiting queue and finalizing carry-forward',
  })
  @ApiResponse({ status: 200, description: 'Day ended successfully' })
  @ApiResponse({
    status: 409,
    description: 'In-flight spin must be resolved before ending day',
  })
  async endDay(
    @Param('id') dayId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.exhibitionsService.endDay(dayId, userId, userEmail);
  }

  @Patch('days/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update exhibition day parameters (label, pacing hours)',
  })
  async updateDay(
    @Param('id') dayId: string,
    @Body() dto: UpdateDayDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.exhibitionsService.updateDay(dayId, dto, userId, userEmail);
  }

  @Post(':id/pause')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Manually pause exhibition activities (spins paused, registrations allowed)',
  })
  async pauseExhibition(
    @Param('id') exhibitionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.exhibitionsService.setPauseStatus(
      exhibitionId,
      true,
      userId,
      userEmail,
    );
  }

  @Post(':id/resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume previously paused exhibition activities' })
  async resumeExhibition(
    @Param('id') exhibitionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.exhibitionsService.setPauseStatus(
      exhibitionId,
      false,
      userId,
      userEmail,
    );
  }
}
