import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async createRoom(
    creatorId: string,
    dto: {
      name: string;
      isGroup: boolean;
      members: {
        userId: string;
        deviceId?: string | null;
        envelope?: {
          encryptedRoomKey: string;
          keyEnvelopeIV?: string;
          keyEnvelopeTag?: string;
          keyEnvelopeAlg?: string;
        } | null;
      }[];
    },
  ) {
    const room = await this.prisma.room.create({
      data: { name: dto.name, isGroup: dto.isGroup },
    });

    // Ensure creator is included
    const allMembers = dto.members.some((m) => m.userId === creatorId)
      ? dto.members
      : [{ userId: creatorId }, ...dto.members];

    for (const m of allMembers) {
      await this.prisma.roomUser.create({
        data: {
          roomId: room.id,
          userId: m.userId,
          encryptedRoomKey: m.envelope?.encryptedRoomKey ?? null,
          keyEnvelopeIV: m.envelope?.keyEnvelopeIV ?? null,
          keyEnvelopeTag: m.envelope?.keyEnvelopeTag ?? null,
          keyEnvelopeAlg: m.envelope?.keyEnvelopeAlg ?? null,
          deviceId: m.deviceId ?? null,
        },
      });
    }

    return room;
  }

  async addMembers(
    requestorId: string,
    roomId: string,
    members: Array<{
      userId: string;
      deviceId?: string | null;
      envelope?: {
        encryptedRoomKey: string;
        keyEnvelopeIV?: string;
        keyEnvelopeTag?: string;
        keyEnvelopeAlg?: string;
      } | null;
    }>,
  ) {
    // authorize requestor is a member
    const member = await this.prisma.roomUser.findFirst({
      where: { roomId, userId: requestorId },
    });
    if (!member) throw new ForbiddenException('Not in room');

    for (const m of members) {
      await this.prisma.roomUser.create({
        data: {
          roomId,
          userId: m.userId,
          encryptedRoomKey: m.envelope?.encryptedRoomKey ?? null,
          keyEnvelopeIV: m.envelope?.keyEnvelopeIV ?? null,
          keyEnvelopeTag: m.envelope?.keyEnvelopeTag ?? null,
          keyEnvelopeAlg: m.envelope?.keyEnvelopeAlg ?? null,
          deviceId: m.deviceId ?? null,
        },
      });
    }
    return { added: members.length };
  }

  async myEnvelope(roomId: string, userId: string) {
    return this.prisma.roomUser.findMany({
      where: { roomId, userId },
      select: {
        id: true,
        deviceId: true,
        encryptedRoomKey: true,
        keyEnvelopeIV: true,
        keyEnvelopeTag: true,
        keyEnvelopeAlg: true,
      },
    });
  }

  async listMembers(roomId: string) {
    return this.prisma.roomUser.findMany({
      where: { roomId },
      include: { user: { select: { id: true, username: true } } },
    });
  }
}
