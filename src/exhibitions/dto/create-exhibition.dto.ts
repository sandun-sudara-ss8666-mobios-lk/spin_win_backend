import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExhibitionDto {
  @ApiProperty({ example: 'MobiOs Spin & Win @ INFOTEL 2026' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Annual flagship exhibition event', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Asia/Colombo', default: 'Asia/Colombo' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: '09:00:00', default: '09:00:00' })
  @IsString()
  @IsOptional()
  pacingStartTime?: string;

  @ApiProperty({ example: '21:00:00', default: '21:00:00' })
  @IsString()
  @IsOptional()
  pacingEndTime?: string;
}

export class UpdateDayDto {
  @ApiProperty({ example: 'Day 1 - November 6', required: false })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ example: '09:00:00', required: false })
  @IsString()
  @IsOptional()
  pacingStartTime?: string;

  @ApiProperty({ example: '21:00:00', required: false })
  @IsString()
  @IsOptional()
  pacingEndTime?: string;
}
