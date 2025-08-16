import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/core/errors/app-error';
import { assert } from 'src/core/errors/assert';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getChats(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    assert(user, 'user not found', ErrorCode.USER_NOT_FOUND);

    const connections = await this.prisma.connection.findMany({
      where: { OR: [{ userId: user.id }, { connectedUserId: user.id }] },
      include: {
        user: { select: { id: true, username: true } },
        connectedUser: { select: { id: true, username: true } },
      },
    });

    const connectionChats = await Promise.all(
      connections.map(async (c) => {
        const otherUser = c.userId === user.id ? c.connectedUser : c.user;
        const lastMessage = await this.prisma.message.findFirst({
          where: { connectionId: c.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          id: c.id,
          type: 'connection',
          participant: otherUser,
          lastMessage,
          createdAt: lastMessage?.createdAt ?? c.createdAt,
        };
      }),
    );

    // Group chats
    const rooms = await this.prisma.roomUser.findMany({
      where: { userId: user?.id },
      include: {
        room: {
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
    });

    const groupChats = rooms.map((ru) => ({
      id: ru.room.id,
      type: 'group',
      name: ru.room.name,
      lastMessage: ru.room.messages[0] || null,
      createdAt: ru.room.messages[0]?.createdAt ?? ru.room.createdAt,
    }));

    console.log(connectionChats, groupChats);

    const chats = [...connectionChats, ...groupChats].sort((a, b) => {
      const aDate = a.createdAt ?? new Date(0);
      const bDate = b.createdAt ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
    return {
      chats,
    };
  }

  async setOnline(userId: string, online: boolean) {
    await this.prisma.user.update({ where: { id: userId }, data: { online } });
  }

  async listOnlineIds() {
    const users = await this.prisma.user.findMany({
      where: { online: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
