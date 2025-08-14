import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/options')
  async generateRegistrationOptions(
    @Body('username') username: string,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.authService.generateRegistrationOptions(username);
  }

  @Post('register/verify/:userId')
  async verifyRegistrationResponse(
    @Param('userId') userId: string,
    @Body() body: RegistrationResponseJSON,
  ) {
    return this.authService.verifyRegistrationResponse(userId, body);
  }

  @Post('authenticate/options')
  async generateAuthenticationOptions(
    @Body('username') username: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.authService.generateAuthenticationOptions(username);
  }

  @Post('authenticate/verify')
  async verifyAuthenticationResponse(
    @Body('username') username: string,
    @Body() body: AuthenticationResponseJSON,
  ) {
    return this.authService.verifyAuthenticationResponseMethod(username, body);
  }
}
