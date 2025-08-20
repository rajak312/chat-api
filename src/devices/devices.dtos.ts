import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'laptop-123', description: 'Unique device name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'BASE64_ENCODED_PUBLIC_KEY',
    description: 'Base64-encoded public key of the device',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({ example: true, description: 'Whether the device is enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;
}

export class UpdateDeviceDto {
  @ApiProperty({ example: 'my-new-laptop', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'NEW_BASE64_PUBLIC_KEY',
    description: 'Updated public key',
    required: false,
  })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
