import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto, UpdateConnectionDto } from './connections.dtos';
import { Username } from 'src/decorators/username.decorator';
import { Authenticate } from 'src/decorators/authenticate.decorator';

@Controller('connections')
@Authenticate()
export class ConnectionsController {
  constructor(private service: ConnectionsService) {}

  @Post()
  sendRequest(@Username() username: string, @Body() body: CreateConnectionDto) {
    return this.service.sendRequest(username, body.targetUsername);
  }

  @Patch(':id')
  respondRequest(
    @Username() username: string,
    @Param('id') id: string,
    @Body() body: UpdateConnectionDto,
  ) {
    return this.service.respondRequest(id, username, body.status);
  }

  @Get()
  listConnections(@Username() username: string) {
    return this.service.listConnections(username);
  }

  @Delete(':id')
  removeConnection(@Username() username: string, @Param('id') id: string) {
    return this.service.removeConnection(username, id);
  }
}
