import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import {
  CreateMerchantDto,
  UpdateMerchantDto,
} from './dto/create-merchant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Merchants & Sponsors')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new merchant/sponsor' })
  async create(
    @Body() dto: CreateMerchantDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.merchantsService.create(dto, userId, userEmail);
  }

  @Get()
  @ApiOperation({ summary: 'List all active merchants' })
  async findAll(@Query('all') all?: string) {
    return this.merchantsService.findAll(all !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant details by ID' })
  async findOne(@Param('id') id: string) {
    return this.merchantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update merchant details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMerchantDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.merchantsService.update(id, dto, userId, userEmail);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate merchant' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.merchantsService.remove(id, userId, userEmail);
  }
}
