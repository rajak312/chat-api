import { applyDecorators, UseGuards } from '@nestjs/common';
import { SessionGuard } from 'src/guards/session.guard';

export function Authenticate() {
  return applyDecorators(UseGuards(SessionGuard));
}
