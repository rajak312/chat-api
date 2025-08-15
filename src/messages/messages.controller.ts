import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Authenticate } from 'src/decorators/authenticate.decorator';
import { User } from 'src/decorators/user.decorator';
import { SendMessageDto, HistoryQueryDto } from './messages.dtos';

@Authenticate()
@Controller('rooms/:roomId/messages')
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Post()
  send(
    @User('id') userId: string,
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.send(roomId, userId, dto);
  }

  @Get()
  history(
    @User('id') userId: string,
    @Param('roomId') roomId: string,
    @Query() q: HistoryQueryDto,
  ) {
    return this.messages.history(roomId, userId, q.cursor, q.limit ?? 20);
  }

  @Post(':messageId/seen')
  seen(@User('id') userId: string, @Param('messageId') messageId: string) {
    return this.messages.markSeen(messageId, userId);
  }
}
