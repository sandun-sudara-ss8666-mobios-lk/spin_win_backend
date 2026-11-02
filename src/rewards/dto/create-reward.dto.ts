import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export enum RewardTypeEnum {
  PHYSICAL = 'PHYSICAL',
  VOUCHER = 'VOUCHER',
  MERCHANDISE = 'MERCHANDISE',
  NO_WIN = 'NO_WIN',
}

export enum InventoryModeEnum {
  LIMITED = 'LIMITED',
  UNLIMITED = 'UNLIMITED',
  NO_WIN = 'NO_WIN',
}

export enum DistributionStrategyEnum {
  EXHIBITION_WIDE = 'EXHIBITION_WIDE',
  AUTO_DAILY = 'AUTO_DAILY',
  CUSTOM_DAILY = 'CUSTOM_DAILY',
}

export class CreateRewardDto {
  @ApiProperty({ required: false, description: 'Sponsoring Merchant ID' })
  @IsString()
  @IsOptional()
  merchantId?: string;

  @ApiProperty({ example: 'Samsung Galaxy Fit 3' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Smart fitness tracker with AMOLED display',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: RewardTypeEnum, default: RewardTypeEnum.PHYSICAL })
  @IsEnum(RewardTypeEnum)
  type!: RewardTypeEnum;

  @ApiProperty({
    example: 'Galaxy Fit 3',
    maxLength: 24,
    description: 'Short label for wheel slice',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(24)
  shortLabel!: string;

  @ApiProperty({ enum: InventoryModeEnum, default: InventoryModeEnum.LIMITED })
  @IsEnum(InventoryModeEnum)
  inventoryMode!: InventoryModeEnum;

  @ApiProperty({
    enum: DistributionStrategyEnum,
    default: DistributionStrategyEnum.AUTO_DAILY,
  })
  @IsEnum(DistributionStrategyEnum)
  distributionStrategy!: DistributionStrategyEnum;

  @ApiProperty({
    example: 30,
    description:
      'Total physical inventory count (required for LIMITED rewards)',
  })
  @IsInt()
  @Min(0)
  totalPhysicalStock!: number;

  @ApiProperty({
    example: true,
    default: true,
    description: 'Carry forward unused daily quota to next day',
  })
  @IsBoolean()
  @IsOptional()
  carryForward?: boolean;

  @ApiProperty({
    example: 3,
    default: 3,
    description: 'Baseline selection weight (1=Low, 3=Medium, 5=High)',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  baselineWeight?: number;

  @ApiProperty({ example: '#4F46E5', required: false })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({
    required: false,
    description:
      'Custom day allocations if CUSTOM_DAILY: { [dayId]: quantity }',
  })
  @IsOptional()
  customDailyAllocations?: Record<string, number>;
}

export class UpdateRewardDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(24)
  shortLabel?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  carryForward?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  baselineWeight?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AdjustStockDto {
  @ApiProperty({
    example: 10,
    description:
      'Stock change delta (positive to add, negative to reduce safely)',
  })
  @IsInt()
  quantityDelta!: number;

  @ApiProperty({
    example: 'Added supplementary booth inventory from warehouse',
  })
  @IsString()
  @IsNotEmpty()
  notes!: string;
}

export enum CancellationResolutionEnum {
  IMMEDIATE_RETURN = 'IMMEDIATE_RETURN',
  RETURN_TO_PACING = 'RETURN_TO_PACING',
  RETIRE = 'RETIRE',
}

export class CancelAwardDto {
  @ApiProperty({
    enum: CancellationResolutionEnum,
    description: 'How to handle stock upon cancellation',
    example: CancellationResolutionEnum.IMMEDIATE_RETURN,
  })
  @IsEnum(CancellationResolutionEnum)
  resolution!: CancellationResolutionEnum;

  @ApiProperty({ example: 'Visitor did not collect voucher within 30 minutes' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
