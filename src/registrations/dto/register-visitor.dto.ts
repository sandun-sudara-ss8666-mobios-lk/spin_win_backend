import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterVisitorDto {
  @ApiProperty({
    example: 'REG_8f142c94d12a63',
    description: 'Session token issued upon claiming QR',
  })
  @IsString()
  @IsNotEmpty()
  sessionToken!: string;

  @ApiProperty({ example: 'Kamal Perera', description: 'Visitor full name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: '0771234567',
    description: 'Sri Lankan mobile number',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class QueryQueueDto {
  @ApiProperty({
    required: false,
    enum: [
      'WAITING',
      'SELECTED',
      'SPINNING',
      'COMPLETED',
      'SKIPPED',
      'DAY_CLOSED',
    ],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  offset?: number;

  @ApiProperty({ required: false, enum: ['desc', 'asc'], default: 'desc' })
  @IsOptional()
  order?: 'desc' | 'asc';

  @ApiProperty({
    required: false,
    description: 'Search by reference code or visitor name or phone',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
