import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
} from 'class-validator';

export class CreateMerchantDto {
  @ApiProperty({ example: 'Samsung Sri Lanka' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'samsung-sl', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'https://cdn.mobios.lk/brands/samsung.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: '#1428A0', required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ example: 'events@samsung.lk', required: false })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ example: '+94112345678', required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;
}

export class UpdateMerchantDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
