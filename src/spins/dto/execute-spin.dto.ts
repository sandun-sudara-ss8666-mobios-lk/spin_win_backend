import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ExecuteSpinDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Selected participation UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  participationId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Client-generated idempotency key (UUID) to prevent double-spins',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
