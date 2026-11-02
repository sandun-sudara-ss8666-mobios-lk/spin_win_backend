import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@mobios.lk',
    description: 'Admin user email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'AdminPassword@2026', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
