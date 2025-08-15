import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

function parseCookie(header?: string) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(';').forEach((p) => {
    const [k, ...v] = p.trim().split('=');
    out[k] = decodeURIComponent(v.join('=') || '');
  });
  return out;
}

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext) {
    const client: any = ctx.switchToWs().getClient();
    const cookies = parseCookie(client.handshake?.headers?.cookie);
    const sid = cookies['session_id'];
    if (!sid) return false;

    const session = await this.prisma.session.findUnique({
      where: { id: sid },
      include: { user: true },
    });
    if (!session) return false;

    client.data.user = session.user;
    return true;
  }
}
