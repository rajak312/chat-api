import { Controller, Post, Body, Param, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import type { Response, Request } from 'express';
import {
  GenerateWebAuthnOptions,
  LoginUserPayload,
  RegisterUserPayload,
} from './auth.dto';
import ms from 'ms';
import { Authenticate } from 'src/decorators/authenticate.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/options')
  async generateRegistrationOptions(
    @Body() body: GenerateWebAuthnOptions,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.authService.generateRegistrationOptions(body.username);
  }

  @Post('register/verify/:username')
  async verifyRegistrationResponse(
    @Param('username') username: string,
    @Body() body: RegistrationResponseJSON,
  ) {
    return this.authService.verifyRegistrationResponse(username, body);
  }

  @Post('authenticate/options')
  async generateAuthenticationOptions(
    @Body() body: GenerateWebAuthnOptions,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.authService.generateAuthenticationOptions(body.username);
  }

  @Post('authenticate/verify/:username')
  async verifyAuthenticationResponse(
    @Param('username') username: string,
    @Body() body: AuthenticationResponseJSON,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { verified, sessionId } =
      await this.authService.verifyAuthenticationResponseMethod(username, body);
    if (verified) {
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: ms(process.env.INACTIVITY_MAX_MS),
      });
    }

    return {
      message: 'login sucessfully',
    };
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
    const { sessionId } = await this.authService.login(body);

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: ms(process.env.INACTIVITY_MAX_MS),
    });

    return {
      message: 'login sucessfully',
    };
  }

  @Authenticate()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies['session_id'];
    await this.authService.logout(sessionId);
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { message: 'Logged out successfully' };
  }
}
