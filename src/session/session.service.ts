import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSessionAndUserById(id: string) {
    return this.prisma.session.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });
  }
}
