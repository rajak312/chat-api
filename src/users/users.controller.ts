import { Controller, Get } from '@nestjs/common';
import { Authenticate } from 'src/decorators/authenticate.decorator';
import { UsersService } from './users.service';
import { Username } from 'src/decorators/username.decorator';

@Controller('users')
@Authenticate()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getUser(@Username() username: string) {
    return this.usersService.getUserByUsername(username);
  }
}
