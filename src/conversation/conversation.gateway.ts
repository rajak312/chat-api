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
import { UseGuards } from '@nestjs/common';
import { assert } from 'src/core/errors/assert';
import { ErrorCode } from 'src/core/errors/app-error';
import { origin, parseCookie } from 'src/utils';
import { MessagesService } from 'src/messages/messages.service';
import { SessionService } from 'src/session/session.service';
import { SendMessageDto } from 'src/messages/messages.dtos';

@WebSocketGateway({
  cors: {
    origin,
    credentials: true,
  },
})
@UseGuards(WsGuard)
export class ConversationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private userToSocket = new Map<string, string>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly sessionService: SessionService,
  ) {}

  afterInit() {
    this.messagesService.setServer(this.server);
  }

  private async getUserFromCookie(cookie: string) {
    const cookies = parseCookie(cookie);
    const sessionId = cookies['session_id'];
    assert(sessionId, 'session not found', ErrorCode.NOT_FOUND);
    const session = await this.sessionService.getSessionAndUserById(sessionId);
    assert(session, 'session not found', ErrorCode.NOT_FOUND);
    return session.user;
  }

  async handleConnection(client: Socket) {
    const user = await this.getUserFromCookie(
      client.handshake.headers.cookie as string,
    );
    this.userToSocket.set(user.id, client.id);
    this.server.emit('online_users', Array.from(this.userToSocket.keys()));
  }

  async handleDisconnect(client: Socket) {
    const user = await this.getUserFromCookie(
      client.handshake.headers.cookie as string,
    );
    this.userToSocket.delete(user.id);
    this.server.emit('online_users', Array.from(this.userToSocket.keys()));
  }

  @SubscribeMessage('send_message')
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto & { id: string },
  ) {
    console.log('Gateway', data);
    return this.messagesService.send(client.data.user.id, data.id, data);
  }

  @SubscribeMessage('message_seen')
  async seen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    return this.messagesService.markSeen(data.messageId, client.data.user.id);
  }
}
