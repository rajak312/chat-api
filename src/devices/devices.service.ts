import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeviceDto, UpdateDeviceDto } from './devices.dtos';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(username: string, dto: CreateDeviceDto) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    const device = await this.prisma.device.findUnique({
      where: {
        name: dto.name,
      },
    });
    if (device) return device;

    return this.prisma.device.create({
      data: {
        userId: user.id,
        name: dto.name,
        publicKey: dto.publicKey,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async findAllForUser(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { devices: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.devices;
  }

  async update(id: string, dto: UpdateDeviceDto) {
    return this.prisma.device.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string) {
    return this.prisma.device.delete({ where: { id } });
  }

  async getDevicesByUserId(userId: string) {
    return this.prisma.device.findMany({
      where: {
        userId,
      },
    });
  }
}
