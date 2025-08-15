import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { CryptoService } from './crypto.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CryptoController],
  providers: [CryptoService, PrismaService],
  exports: [CryptoService],
})
export class CryptoModule {}
