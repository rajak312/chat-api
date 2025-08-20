import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @ApiProperty({ description: 'Encrypted message text' })
  ciphertext!: string;

  @IsString()
  @ApiProperty({ description: 'sender device id' })
  recipientDeviceId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Initialization vector for encryption' })
  iv?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Authentication tag for encryption' })
  authTag?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Type of message content' })
  contentType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Version of encryption' })
  version?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Room ID or connection Id' })
  id: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Sender ephemeral public key for session encryption',
  })
  senderEphemeralPublic?: string;

  @IsString()
  @ApiProperty({
    description: 'Sender device Id',
  })
  senderDeviceId: string;
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
}

export class MessageSeenDto {
  @IsString()
  @ApiProperty({ description: 'ID of the message being marked as seen' })
  messageId!: string;
}
