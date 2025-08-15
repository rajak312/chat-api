import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import ms from 'ms';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const sessionId = req.cookies['session_id'];
    if (!sessionId) throw new UnauthorizedException('No session found');

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
      },
    });
    if (!session) throw new UnauthorizedException('Session not found');

    const timeout = ms(process.env.INACTIVITY_MAX_MS);
    if (Date.now() - session.lastActivity.getTime() > timeout) {
      await this.prisma.session.delete({ where: { id: sessionId } });
      throw new UnauthorizedException('Session expired due to inactivity');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });

    req.user = session.user;

    return true;
  }
}
