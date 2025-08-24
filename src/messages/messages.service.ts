import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from './messages.dtos';
import { assert } from 'src/core/errors/assert';
import { ErrorCode } from 'src/core/errors/app-error';

@Injectable()
export class MessagesService {
  private io: Server | null = null;

  constructor(private prisma: PrismaService) {}

  setServer(io: Server) {
    this.io = io;
  }

  async send(senderId: string, targetId: string, dto: SendMessageDto) {
    assert(targetId, 'invalid input', ErrorCode.INVALID_INPUT);

    const roomMember = await this.prisma.roomUser.findFirst({
      where: { userId: senderId, ...(dto.id ? { roomId: dto.id } : {}) },
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

    assert(
      Array.isArray((dto as any).wrappedKeys) &&
        (dto as any).wrappedKeys.length > 0,
      'wrappedKeys (per-device) required',
      ErrorCode.INVALID_INPUT,
    );

    const message = await this.prisma.message.create({
      data: {
        roomId: dto.id ?? null,
        connectionId: dto.id ?? null,
        senderId,
        ciphertext: dto.ciphertext,
        senderEphemeralPublic: dto.senderEphemeralPublic ?? null,
        iv: dto.iv ?? null,
        authTag: dto.authTag ?? null,
        contentType: dto.contentType ?? null,
        version: dto.version ?? 'v1',
        senderDeviceId: dto.senderDeviceId,
      },
      include: {
        sender: { select: { id: true, username: true } },
        seenBy: true,
      },
    });

    const wrappedKeysPayload = dto.wrappedKeys.map((wk) => ({
      messageId: message.id,
      deviceId: wk.deviceId,
      encryptedKey: wk.encryptedKey,
    }));

    if (wrappedKeysPayload.length) {
      await this.prisma.wrappedKey.createMany({
        data: wrappedKeysPayload,
      });
    }

    if (this.io) {
      const broadcastId = dto.id ?? targetId;
      this.io
        .to(broadcastId)
        .emit('message_created', { messageId: message.id });

      for (const wk of wrappedKeysPayload) {
        const deviceId = wk.deviceId;
        const encryptedKey = wk.encryptedKey;

        const perDevicePayload = {
          messageId: message.id,
          sender: message.sender,
          senderDeviceId: message.senderDeviceId,
          iv: message.iv,
          ciphertext: message.ciphertext,
          encryptedKey,
          createdAt: message.createdAt,
          contentType: message.contentType,
          version: message.version,
        };

        const socketIds = this.getSocketIdsForDevice(deviceId);
        if (socketIds && socketIds.length) {
          for (const sid of socketIds) {
            this.io.to(sid).emit('receive_message', perDevicePayload);
          }
        }
      }
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

    const messages = await this.prisma.message.findMany({
      where: {
        AND: [
          { OR: [{ roomId: targetId }, { connectionId: targetId }] },
          {
            OR: [{ wrappedKeys: { some: { deviceId } } }, { senderId: userId }],
          },
        ],
      },
      include: {
        sender: { select: { id: true, username: true } },
        seenBy: true,
        wrappedKeys: {
          where: { deviceId },
          select: { id: true, deviceId: true, encryptedKey: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: typeof limit === 'string' ? parseInt(limit) : limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return messages;
  }

  async markSeen(messageId: string, userId: string) {
    const existing = await this.prisma.messageSeen.findFirst({
      where: { messageId, userId },
    });
    if (existing) return existing;

    const seen = await this.prisma.messageSeen.create({
      data: { messageId, userId },
    });

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

  private getSocketIdsForDevice(deviceId: string): string[] {
    if (!this.io) return [];
    const room = this.io.sockets.adapter.rooms.get(deviceId);
    if (!room) return [];
    return Array.from(room) as string[];
  }
}
