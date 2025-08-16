import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [ConnectionsService, PrismaService],
  controllers: [ConnectionsController],
})
export class ConnectionsModule {}
