import { Controller, Post, Body, Param, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import type { Response } from 'express';
import { LoginUserPayload, RegisterUserPayload } from './auth.dto';
import ms from 'ms';

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

  @Post('register')
  async register(@Body() body: RegisterUserPayload) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(
    @Body() body: LoginUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, sessionId } =
      await this.authService.login(body);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: ms(process.env.REFRESH_TOKEN_TTL),
    });

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: ms(process.env.INACTIVITY_MAX_MS),
    });

    return { accessToken };
  }
}
