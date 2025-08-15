import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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
