import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Authenticate } from 'src/decorators/authenticate.decorator';
import { User } from 'src/decorators/user.decorator';
import { CreateRoomDto } from './rooms.dtos';

@Authenticate()
@Controller('rooms')
export class RoomsController {
  constructor(private rooms: RoomsService) {}

  @Post()
  create(@User('id') userId: string, @Body() dto: CreateRoomDto) {
    return this.rooms.createRoom(userId, dto);
  }

  @Post(':roomId/members')
  addMembers(
    @User('id') userId: string,
    @Param('roomId') roomId: string,
    @Body() body: { members: CreateRoomDto['members'] },
  ) {
    return this.rooms.addMembers(userId, roomId, body.members);
  }

  @Get(':roomId/members')
  listMembers(@Param('roomId') roomId: string) {
    return this.rooms.listMembers(roomId);
  }

  @Get(':roomId/members/me/envelopes')
  myEnvelope(@User('id') userId: string, @Param('roomId') roomId: string) {
    return this.rooms.myEnvelope(roomId, userId);
  }
}
