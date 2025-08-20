import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from './messages.dtos';
import { assert } from 'src/core/errors/assert';
import { ErrorCode } from 'src/core/errors/app-error';

@Injectable()
export class MessagesService {
  private io: Server;

  constructor(private prisma: PrismaService) {}

  setServer(io: Server) {
    this.io = io;
  }

  async send(senderId: string, targetId: string, dto: SendMessageDto) {
    assert(targetId, 'invalid input', ErrorCode.INVALID_INPUT);

    console.log('CAlling Sedn', senderId);

    const roomMember = await this.prisma.roomUser.findFirst({
      where: {
        userId: senderId,
        ...(dto.id ? { roomId: dto.id } : {}),
      },
    });
    const connection = await this.prisma.connection.findFirst({
      where: {
        id: dto.id ?? targetId,
        OR: [{ userId: senderId }, { connectedUserId: senderId }],
      },
    });

    assert(
      roomMember || connection,
      'Not in connection/room',
      ErrorCode.NOT_FOUND,
    );

    // Create message
    const message = await this.prisma.message.create({
      data: {
        roomId: dto.id ?? null,
        connectionId: dto.id ?? null,
        senderId,
        ciphertext: dto.ciphertext,
        senderEphemeralPublic: dto.senderEphemeralPublic,
        iv: dto.iv ?? null,
        authTag: dto.authTag ?? null,
        contentType: dto.contentType ?? null,
        version: dto.version ?? 'v1',
        recipientDeviceId: dto.recipientDeviceId,
        senderDeviceId: dto.senderDeviceId,
      },
      include: {
        sender: { select: { id: true, username: true } },
        seenBy: true,
      },
    });

    if (this.io) {
      const broadcastId = dto.id ?? dto.id ?? targetId;
      this.io.to(broadcastId).emit('receive_message', message);
    }

    return message;
  }

  async history(
    userId: string,
    targetId: string,
    deviceId?: string,
    cursor?: string,
    limit = 20,
  ) {
    assert(targetId, 'invalid input', ErrorCode.INVALID_INPUT);
    assert(deviceId, 'please send your deviceId', ErrorCode.INVALID_INPUT);
    const roomMember = await this.prisma.roomUser.findFirst({
      where: { roomId: targetId, userId },
    });
    const connection = await this.prisma.connection.findFirst({
      where: {
        id: targetId,
        OR: [{ userId }, { connectedUserId: userId }],
      },
    });

    assert(
      roomMember || connection,
      'Not in connection/room',
      ErrorCode.NOT_FOUND,
    );

    console.log('id', deviceId);

    return this.prisma.message.findMany({
      where: {
        AND: [
          { OR: [{ roomId: targetId }, { connectionId: targetId }] },
          {
            OR: [{ recipientDeviceId: deviceId }, { senderId: userId }],
          },
        ],
      },
      include: {
        sender: { select: { id: true, username: true } },
        seenBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: typeof limit === 'string' ? parseInt(limit) : limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  // Mark a message as seen
  async markSeen(messageId: string, userId: string) {
    const existing = await this.prisma.messageSeen.findFirst({
      where: { messageId, userId },
    });
    if (existing) return existing;

    const seen = await this.prisma.messageSeen.create({
      data: { messageId, userId },
    });

    // Emit WebSocket event
    if (this.io) {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: { seenBy: true },
      });
      const targetId = message?.roomId ?? message?.connectionId;
      if (targetId) {
        this.io.to(targetId).emit('message_seen', message);
      }
    }

    return seen;
  }
}
