import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { assert } from 'src/core/errors/assert';
import { ErrorCode } from 'src/core/errors/app-error';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(username: string, targetUsername: string) {
    assert(
      username !== targetUsername,
      'You cannot connect with yourself',
      ErrorCode.FORBIDDEN,
    );

    const user = await this.prisma.user.findUnique({ where: { username } });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);

    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });
    assert(
      target,
      `User ${targetUsername} not found`,
      ErrorCode.USER_NOT_FOUND,
    );

    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { userId: user.id, connectedUserId: target.id },
          { userId: target.id, connectedUserId: user.id },
        ],
      },
    });
    assert(!existing, 'Connection already exists', ErrorCode.FORBIDDEN);

    return this.prisma.connection.create({
      data: { userId: user.id, connectedUserId: target.id },
      include: {
        user: { select: { id: true, username: true } },
        connectedUser: { select: { id: true, username: true } },
      },
    });
  }

  async listConnections(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);

    return this.prisma.connection.findMany({
      where: { OR: [{ userId: user.id }, { connectedUserId: user.id }] },
      include: {
        user: { select: { id: true, username: true } },
        connectedUser: { select: { id: true, username: true } },
      },
    });
  }

  async removeConnection(username: string, connectionId: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);

    const conn = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    assert(
      conn && (conn.userId === user.id || conn.connectedUserId === user.id),
      'Not authorized',
      ErrorCode.FORBIDDEN,
    );

    return this.prisma.connection.delete({ where: { id: connectionId } });
  }

  async respondRequest(
    connectionId: string,
    username: string,
    status: 'accepted' | 'rejected',
  ) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);

    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    assert(connection, `Connection not found`, ErrorCode.USER_NOT_FOUND);

    assert(
      connection.connectedUserId === user.id,
      'Not authorized to respond',
      ErrorCode.FORBIDDEN,
    );

    if (status === 'rejected') {
      return this.prisma.connection.delete({ where: { id: connectionId } });
    } else if (status === 'accepted') {
      // Optionally, you could set a "status" column in Connection instead of deleting/creating
      // For now, just return the updated connection
      return this.prisma.connection.update({
        where: { id: connectionId },
        data: {
          /* add status field if needed */
        },
        include: {
          user: { select: { id: true, username: true } },
          connectedUser: { select: { id: true, username: true } },
        },
      });
    }

    assert(false, 'Invalid status', ErrorCode.BAD_REQUEST);
  }
}
