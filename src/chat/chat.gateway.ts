import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsGuard } from 'src/guards/ws.guard';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_APP_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userToSocket = new Map<string, string>(); // userId -> socketId

  constructor(
    private chat: ChatService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const user = client.data.user;
    if (!user) return client.disconnect();

    this.userToSocket.set(user.id, client.id);
    await this.chat.setOnline(user.id, true);

    this.server.emit('online_users', await this.chat.listOnlineIds());
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    this.userToSocket.delete(user.id);
    await this.chat.setOnline(user.id, false);

    this.server.emit('online_users', await this.chat.listOnlineIds());
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    // optionally: authorize membership
    client.join(data.roomId);
  }

  @SubscribeMessage('user_typing')
  async typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.to(data.roomId).emit('user_typing', {
      userId: client.data.user.id,
      roomId: data.roomId,
    });
  }

  @SubscribeMessage('send_message')
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      ciphertext: string;
      iv?: string;
      authTag?: string;
      contentType?: string;
      version?: string;
    },
  ) {
    // store ciphertext only
    const msg = await this.prisma.message.create({
      data: {
        roomId: data.roomId,
        senderId: client.data.user.id,
        ciphertext: data.ciphertext,
        iv: data.iv ?? null,
        authTag: data.authTag ?? null,
        contentType: data.contentType ?? null,
        version: data.version ?? 'v1',
      },
      include: {
        sender: { select: { id: true, username: true } },
        seenBy: true,
      },
    });

    this.server.to(data.roomId).emit('receive_message', msg);
  }

  @SubscribeMessage('message_seen')
  async seen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const existing = await this.prisma.messageSeen.findFirst({
      where: { messageId: data.messageId, userId: client.data.user.id },
    });
    if (!existing) {
      await this.prisma.messageSeen.create({
        data: { messageId: data.messageId, userId: client.data.user.id },
      });
    }

    const msg = await this.prisma.message.findUnique({
      where: { id: data.messageId },
      include: { seenBy: true },
    });

    const targetId = msg?.roomId ?? msg?.connectionId;
    if (targetId) {
      this.server.to(targetId).emit('message_seen', msg);
    }
  }
}
