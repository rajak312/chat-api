import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, PrismaService],
  exports: [DevicesService],
})
export class DevicesModule {}
