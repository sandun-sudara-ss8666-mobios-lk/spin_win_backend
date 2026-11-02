import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSliceDto {
  @ApiProperty({
    example: 0,
    description: 'Visual slice index (0 to sliceCount - 1)',
  })
  @IsInt()
  @Min(0)
  sliceIndex!: number;

  @ApiProperty({
    required: false,
    description: 'Referenced Reward ID (optional for NO_WIN)',
  })
  @IsString()
  @IsOptional()
  rewardId?: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isNoWin?: boolean;

  @ApiProperty({ example: 'iPhone 16' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: '#4F46E5' })
  @IsString()
  @IsNotEmpty()
  backgroundColor!: string;

  @ApiProperty({ example: '#FFFFFF', default: '#FFFFFF' })
  @IsString()
  @IsNotEmpty()
  textColor!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;
}

export class CreateWheelConfigDto {
  @ApiProperty({ example: 'INFOTEL 2026 12-Slice Wheel Setup' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 12, minimum: 2, maximum: 16, default: 12 })
  @IsInt()
  @Min(2)
  @Max(16)
  sliceCount!: number;

  @ApiProperty({ type: [CreateSliceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSliceDto)
  slices!: CreateSliceDto[];
}

export class PriorityItemDto {
  @ApiProperty({ example: 'reward-uuid' })
  @IsString()
  @IsNotEmpty()
  rewardId!: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Strict rank 1..N' })
  @IsInt()
  @Min(1)
  rank!: number;
}

export class CreatePriorityListDto {
  @ApiProperty({ example: 'Peak Hours Morning Ranking' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ type: [PriorityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriorityItemDto)
  items!: PriorityItemDto[];
}
