import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async send(
    roomId: string,
    senderId: string,
    dto: {
      ciphertext: string;
      iv?: string;
      authTag?: string;
      contentType?: string;
      version?: string;
    },
  ) {
    const member = await this.prisma.roomUser.findFirst({
      where: { roomId, userId: senderId },
    });
    if (!member) throw new ForbiddenException('Not in room');

    return this.prisma.message.create({
      data: {
        roomId,
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

  async history(roomId: string, userId: string, cursor?: string, limit = 20) {
    const member = await this.prisma.roomUser.findFirst({
      where: { roomId, userId },
    });
    if (!member) throw new ForbiddenException('Not in room');

    return this.prisma.message.findMany({
      where: { roomId },
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
    // idempotency: ignore duplicate (unique compound could be added in a custom layer)
    const exists = await this.prisma.messageSeen.findFirst({
      where: { messageId, userId },
    });
    if (exists) return exists;

    return this.prisma.messageSeen.create({
      data: { messageId, userId },
    });
  }
}
