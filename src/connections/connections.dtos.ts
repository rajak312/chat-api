import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({
    description: "Target user's username",
    example: 'username',
  })
  @IsString()
  targetUsername: string;
}

export class UpdateConnectionDto {
  @ApiProperty({
    description: 'Status of the connection request',
    enum: ['accepted', 'rejected'],
    example: 'accepted',
  })
  @IsEnum(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';
}
