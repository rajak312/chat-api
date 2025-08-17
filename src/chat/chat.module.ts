import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatController } from './chat.controller';
import { SessionService } from 'src/session/session.service';
import { MessagesService } from 'src/messages/messages.service';

@Module({
  providers: [
    ChatGateway,
    ChatService,
    PrismaService,
    SessionService,
    MessagesService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
