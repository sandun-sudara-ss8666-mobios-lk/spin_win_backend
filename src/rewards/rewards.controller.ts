import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import {
  CreateRewardDto,
  UpdateRewardDto,
  AdjustStockDto,
  CancelAwardDto,
} from './dto/create-reward.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Rewards & Inventory Management')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new reward with stock distribution strategy',
  })
  async create(
    @Body() dto: CreateRewardDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.rewardsService.create(dto, userId, userEmail);
  }

  @Get()
  @ApiOperation({
    summary: 'List all rewards with stock & daily allocation summaries',
  })
  async findAll(@Query('all') all?: string) {
    return this.rewardsService.findAll(all !== 'true');
  }

  @Get('awards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List committed awards with optional day filter' })
  async getAwards(@Query('dayId') dayId?: string) {
    return this.rewardsService.getAwards(dayId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single reward with ledger history & daily allocations',
  })
  async findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update reward metadata' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRewardDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.rewardsService.update(id, dto, userId, userEmail);
  }

  @Post(':id/adjust-stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Adjust physical stock safely with audit ledger entry (prevents dropping below awarded count)',
  })
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.rewardsService.adjustStock(id, dto, userId, userEmail);
  }

  @Post('awards/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Staff cancels an uncollected award (IMMEDIATE_RETURN, RETURN_TO_PACING, or RETIRE)',
  })
  @ApiResponse({ status: 200, description: 'Award cancelled successfully' })
  async cancelAward(
    @Param('id') awardId: string,
    @Body() dto: CancelAwardDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.rewardsService.cancelAward(awardId, dto, userId, userEmail);
  }
}
