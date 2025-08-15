import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class RegisterUserPayload {
  @ApiProperty({
    example: 'john_doe',
    description: 'Unique username for the user',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description:
      'Password for the account (required for password-based registration)',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number with country code',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class LoginUserPayload {
  @ApiProperty({ example: 'john_doe', description: 'Username for login' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'StrongPass123!', description: 'Password for login' })
  @IsString()
  password: string;
}
