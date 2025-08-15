import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CryptoService {
  constructor(private prisma: PrismaService) {}

  async registerDevice(
    userId: string,
    dto: {
      name?: string;
      identityKey: string;
      signedPreKey: string;
      spkSignature: string;
    },
  ) {
    return this.prisma.device.create({
      data: {
        userId,
        name: dto.name ?? null,
        identityKey: dto.identityKey,
        signedPreKey: dto.signedPreKey,
        spkSignature: dto.spkSignature,
      },
    });
  }

  async uploadPrekeys(
    deviceId: string,
    keys: { keyId: number; publicKey: string }[],
  ) {
    if (!keys?.length) throw new BadRequestException('No keys');
    await this.prisma.oneTimePreKey.createMany({
      data: keys.map((k) => ({
        deviceId,
        keyId: k.keyId,
        publicKey: k.publicKey,
      })),
    });
    return { uploaded: keys.length };
  }

  // Return a bundle for session establishment with this device
  async claimOneTimePrekey(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });
    if (!device || !device.enabled)
      throw new NotFoundException('Device not found');

    const prekey = await this.prisma.oneTimePreKey.findFirst({
      where: { deviceId, consumed: false },
      orderBy: { keyId: 'asc' },
    });

    if (prekey) {
      await this.prisma.oneTimePreKey.update({
        where: { id: prekey.id },
        data: { consumed: true },
      });
    }

    return {
      identityKey: device.identityKey,
      signedPreKey: device.signedPreKey,
      spkSignature: device.spkSignature,
      oneTimePreKey: prekey
        ? { keyId: prekey.keyId, publicKey: prekey.publicKey }
        : null,
    };
  }

  async listPublicDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId, enabled: true },
      select: {
        id: true,
        name: true,
        identityKey: true,
        signedPreKey: true,
        spkSignature: true,
      },
    });
  }
}
