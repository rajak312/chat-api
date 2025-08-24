import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { RoomsModule } from './rooms/rooms.module';
import { ConnectionsModule } from './connections/connections.module';
import { DevicesModule } from './devices/devices.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MessagesModule,
    RoomsModule,
    ConnectionsModule,
    DevicesModule,
    ConversationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
