import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ example: 'Project Chat', required: false })
  name?: string;

  @ApiProperty({
    type: [String],
    description: 'User IDs participating in this conversation',
  })
  userIds: string[];
}

export class UpdateConversationDto {
  @ApiProperty({ example: 'New Conversation Name', required: false })
  name?: string;
}
