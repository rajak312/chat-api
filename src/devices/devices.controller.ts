import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto } from './devices.dtos';
import { Username } from 'src/decorators/username.decorator';
import { Authenticate } from 'src/decorators/authenticate.decorator';

@Controller('devices')
@Authenticate()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async registerDevice(
    @Username() username: string,
    @Body() dto: CreateDeviceDto,
  ) {
    return this.devicesService.register(username, dto);
  }

  @Get(':id')
  async getDevice(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Get('users/:id')
  async getDevices(@Param('id') id: string) {
    return this.devicesService.getDevicesByUserId(id);
  }

  @Get()
  async getUserDevices(@Username() username: string) {
    return this.devicesService.findAllForUser(username);
  }

  @Patch(':id')
  async updateDevice(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.devicesService.update(id, dto);
  }

  @Delete(':id')
  async removeDevice(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
