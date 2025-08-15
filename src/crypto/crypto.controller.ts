import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { Authenticate } from 'src/decorators/authenticate.decorator';
import { User } from 'src/decorators/user.decorator';
import { RegisterDeviceDto, UploadPrekeysDto } from './crypto.dtos';

@Authenticate()
@Controller('crypto')
export class CryptoController {
  constructor(private crypto: CryptoService) {}

  @Post('devices')
  async registerDevice(
    @User('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.crypto.registerDevice(userId, dto);
  }

  @Post('devices/:deviceId/prekeys')
  async uploadPrekeys(
    @Param('deviceId') deviceId: string,
    @Body() dto: UploadPrekeysDto,
  ) {
    return this.crypto.uploadPrekeys(deviceId, dto.keys);
  }

  @Get('devices/:deviceId/claim')
  async claimPrekey(@Param('deviceId') deviceId: string) {
    return this.crypto.claimOneTimePrekey(deviceId);
  }

  @Get('users/:userId/devices')
  async listPublicDevices(@Param('userId') userId: string) {
    return this.crypto.listPublicDevices(userId);
  }
}
