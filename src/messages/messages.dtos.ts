import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Room ID for group chat' })
  roomId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Connection ID for 1-to-1 chat' })
  connectionId?: string;

  @IsString()
  @ApiProperty({ description: 'Encrypted message text' })
  ciphertext!: string;

  @IsOptional()
  @IsString()
  iv?: string;

  @IsOptional()
  @IsString()
  authTag?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ description: 'Message ID to paginate before' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of messages to fetch' })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Room ID if fetching room messages' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({
    description: 'Connection ID if fetching direct messages',
  })
  @IsOptional()
  @IsString()
  connectionId?: string;
}
