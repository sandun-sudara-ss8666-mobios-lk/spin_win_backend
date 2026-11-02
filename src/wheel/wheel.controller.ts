import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { WheelService } from './wheel.service';
import {
  CreateWheelConfigDto,
  CreatePriorityListDto,
} from './dto/create-wheel-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wheel Configuration & Priority Ranking')
@Controller('wheel')
export class WheelController {
  constructor(private readonly wheelService: WheelService) {}

  @Get('active')
  @ApiOperation({
    summary:
      'Public/Kiosk endpoint: returns active published wheel visual configuration (no odds or stock leaked)',
  })
  async getActiveWheel() {
    return this.wheelService.getActiveWheelDisplayConfig();
  }

  @Get('probability-preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Admin preview: dynamic probabilities of all slices evaluated against current pacing and active priority curve',
  })
  async getProbabilityPreview() {
    return this.wheelService.getProbabilityPreview();
  }

  @Get('configs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all wheel configurations (drafts and published)',
  })
  async getAllConfigs() {
    return this.wheelService.getAllConfigs();
  }

  @Post('configs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a draft wheel configuration with 2-16 slices',
  })
  async createConfig(
    @Body() dto: CreateWheelConfigDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.wheelService.createDraftConfig(dto, userId, userEmail);
  }

  @Post('configs/:id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Publish wheel configuration (strictly validates presence of fallback UNLIMITED or NO_WIN outcome)',
  })
  @ApiResponse({ status: 200, description: 'Wheel configuration published' })
  @ApiResponse({ status: 400, description: 'Missing fallback outcome' })
  async publishConfig(
    @Param('id') configId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.wheelService.publishConfig(configId, userId, userEmail);
  }

  // --- Priority Lists ---

  @Get('priority-lists')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all priority ranking lists' })
  async getAllPriorityLists() {
    return this.wheelService.getAllPriorityLists();
  }

  @Post('priority-lists')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create a draft priority list ranking a subset of rewards 1..N strictly',
  })
  async createPriorityList(
    @Body() dto: CreatePriorityListDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.wheelService.createPriorityList(dto, userId, userEmail);
  }

  @Post('priority-lists/:id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Publish priority list to apply monotonic ranking curve to live spins',
  })
  async publishPriorityList(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.wheelService.publishPriorityList(id, userId, userEmail);
  }

  @Post('priority-lists/:id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate priority list and revert to baseline weights',
  })
  async deactivatePriorityList(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.wheelService.deactivatePriorityList(id, userId, userEmail);
  }
}
