import { Controller, Get, Param } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { Authenticate } from 'src/decorators/authenticate.decorator';
import { User } from 'src/decorators/user.decorator';
import { ApiTags, ApiParam } from '@nestjs/swagger';

@Authenticate()
@ApiTags('Conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  getAll(@User('id') userId: string) {
    return this.conversationService.getAll(userId);
  }
}
