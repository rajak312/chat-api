import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Authenticate } from 'src/decorators/authenticate.decorator';
import { User } from 'src/decorators/user.decorator';
import { SendMessageDto, HistoryQueryDto } from './messages.dtos';
import { ApiTags, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';

@Authenticate()
@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Post(':id')
  @ApiParam({ name: 'id', description: 'Room ID or Connection ID' })
  @ApiBody({ type: SendMessageDto })
  sendMessage(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const payload = {
      ...dto,
      roomId: dto.roomId ?? id,
      connectionId: dto.connectionId ?? id,
    };
    return this.messages.send(userId, payload);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Room ID or Connection ID' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMessages(
    @User('id') userId: string,
    @Param('id') id: string,
    @Query() q: HistoryQueryDto,
  ) {
    return this.messages.history(
      userId,
      q?.roomId ?? id,
      q?.connectionId ?? id,
      q.cursor,
      q.limit ?? 20,
    );
  }

  @Post(':messageId/seen')
  @ApiParam({ name: 'messageId', description: 'ID of message to mark as seen' })
  markSeen(@User('id') userId: string, @Param('messageId') messageId: string) {
    return this.messages.markSeen(messageId, userId);
  }
}
