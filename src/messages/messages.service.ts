import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // Send message to room or connection
  async send(
    senderId: string,
    dto: {
      roomId?: string;
      connectionId?: string;
      ciphertext: string;
      iv?: string;
      authTag?: string;
      contentType?: string;
      version?: string;
    },
  ) {
    if (!dto.roomId && !dto.connectionId) {
      throw new ForbiddenException(
        'Either roomId or connectionId must be provided',
      );
    }
    if (dto.roomId) {
      const member = await this.prisma.roomUser.findFirst({
        where: { roomId: dto.roomId, userId: senderId },
      });
      if (!member) throw new ForbiddenException('Not in room');
    }

    // Validate direct connection
    if (dto.connectionId) {
      const connection = await this.prisma.connection.findFirst({
        where: {
          id: dto.connectionId,
          OR: [{ userId: senderId }, { connectedUserId: senderId }],
        },
      });
      if (!connection) throw new ForbiddenException('Not in connection');
    }

    return this.prisma.message.create({
      data: {
        roomId: dto.roomId ?? null,
        connectionId: dto.connectionId ?? null,
        senderId,
        ciphertext: dto.ciphertext,
        iv: dto.iv ?? null,
        authTag: dto.authTag ?? null,
        contentType: dto.contentType ?? null,
        version: dto.version ?? 'v1',
      },
      include: {
        sender: { select: { id: true, username: true } },
        seenBy: true,
      },
    });
  }

  async history(
    userId: string,
    roomId?: string,
    connectionId?: string,
    cursor?: string,
    limit = 20,
  ) {
    if (!roomId && !connectionId) {
      throw new ForbiddenException(
        'Either roomId or connectionId must be provided',
      );
    }

    if (roomId) {
      const member = await this.prisma.roomUser.findFirst({
        where: { roomId, userId },
      });
      if (!member) throw new ForbiddenException('Not in room');
    }

    if (connectionId) {
      const connection = await this.prisma.connection.findFirst({
        where: {
          id: connectionId,
          OR: [{ userId }, { connectedUserId: userId }],
        },
      });
      if (!connection) throw new ForbiddenException('Not in connection');
    }

    return this.prisma.message.findMany({
      where: {
        roomId: roomId ?? null,
        connectionId: connectionId ?? null,
      },
      include: {
        sender: { select: { id: true, username: true } },
        seenBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async markSeen(messageId: string, userId: string) {
    const exists = await this.prisma.messageSeen.findFirst({
      where: { messageId, userId },
    });
    if (exists) return exists;

    return this.prisma.messageSeen.create({
      data: { messageId, userId },
    });
  }
}
