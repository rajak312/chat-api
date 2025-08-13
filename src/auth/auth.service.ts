// auth.service.ts
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(userId: string) {
    const sessionId = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: refreshHash,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    const accessToken = this.generateAccessToken(userId, sessionId);

    return { accessToken, refreshToken };
  }

  generateAccessToken(userId: string, sessionId: string) {
    return jwt.sign(
      { sub: userId, sid: sessionId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '5m' }
    );
  }

  async refreshTokens(sessionId: string, refreshToken: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new UnauthorizedException();

    // check idle timeout
    const now = Date.now();
    if (now - new Date(session.lastActivity).getTime() > 5 * 60 * 1000) {
      await this.prisma.session.delete({ where: { id: sessionId } });
      throw new UnauthorizedException('Session expired due to inactivity');
    }

    const valid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!valid) throw new UnauthorizedException();

    // update activity + rotate refresh token
    const newRefreshToken = crypto.randomUUID();
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRefreshHash,
        lastActivity: new Date()
      }
    });

    const newAccessToken = this.generateAccessToken(session.userId, sessionId);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
