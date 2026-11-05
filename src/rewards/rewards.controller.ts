import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { removeRewardVideo, rewardVideoOptions, withRewardVideo } from './reward-video';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
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
@ApiExtraModels(CreateRewardDto, UpdateRewardDto)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new reward with stock distribution strategy',
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ schema: { allOf: [{ $ref: '#/components/schemas/CreateRewardDto' }, {
    type: 'object', properties: { video: { type: 'string', format: 'binary', description: 'MP4, ≤15 MB; browser checks ≤10s and ≤1080p. H.264/AAC recommended.' } },
  }] } })
  @UseInterceptors(FileInterceptor('video', rewardVideoOptions))
  async create(
    @UploadedFile() video: { buffer: Buffer } | undefined,
    @Body() dto: CreateRewardDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return withRewardVideo(video, (url) => this.rewardsService.create(dto, userId, userEmail, url));
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
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ schema: { allOf: [{ $ref: '#/components/schemas/UpdateRewardDto' }, {
    type: 'object', properties: { video: { type: 'string', format: 'binary', description: 'MP4, ≤15 MB; browser checks ≤10s and ≤1080p. H.264/AAC recommended.' } },
  }] } })
  @UseInterceptors(FileInterceptor('video', rewardVideoOptions))
  async update(
    @UploadedFile() video: { buffer: Buffer } | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateRewardDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    if (video && dto.removeVideo) throw new BadRequestException('Upload or remove a video, not both');
    const previous = await this.rewardsService.findOne(id);
    const updated = await withRewardVideo(video, (url) =>
      this.rewardsService.update(id, dto, userId, userEmail, dto.removeVideo ? null : url),
    );
    if (previous.videoUrl && previous.videoUrl !== updated.videoUrl) await removeRewardVideo(previous.videoUrl);
    return updated;
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
