import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConversationGateway } from './conversation.gateway';
import { SessionService } from 'src/session/session.service';
import { MessagesService } from 'src/messages/messages.service';

@Module({
  controllers: [ConversationController],
  providers: [
    ConversationService,
    PrismaService,
    SessionService,
    ConversationGateway,
    MessagesService,
  ],
  exports: [ConversationService],
})
export class ConversationModule {}
