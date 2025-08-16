import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Authenticate } from 'src/decorators/authenticate.decorator';
import { Username } from 'src/decorators/username.decorator';

@Controller('chats')
@Authenticate()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getChats(@Username() username: string) {
    return this.chatService.getChats(username);
  }
}
