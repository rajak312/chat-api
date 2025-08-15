import {
  AuthenticatorTransportFuture,
  generateRegistrationOptions,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeType } from '@prisma/client';
import { assert } from 'src/core/errors/assert';
import { ErrorCode } from 'src/core/errors/app-error';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { LoginUserPayload, RegisterUserPayload } from './auth.dto';
import ms from 'ms';

const rpName = process.env.RP_NAME || 'My NestJS App';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.WEB_APP_ORIGIN || 'http://localhost:3000';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async generateRegistrationOptions(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { passkeys: true },
    });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);

    const options: PublicKeyCredentialCreationOptionsJSON =
      await generateRegistrationOptions({
        rpName,
        rpID,
        userName: user.username,
        attestationType: 'none',
        excludeCredentials: user.passkeys.map((passkey) => ({
          id: passkey.id,
          transports: passkey.transports as AuthenticatorTransportFuture[],
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
      });

    await this.prisma.webAuthnChallenge.create({
      data: {
        challenge: options.challenge,
        type: ChallengeType.REGISTRATION,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        user: { connect: { id: user.id } },
      },
    });

    return options;
  }

  async verifyRegistrationResponse(
    username: string,
    response: RegistrationResponseJSON,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);
    const authChallenge = await this.prisma.webAuthnChallenge.findFirst({
      where: { userId: user.id, type: ChallengeType.REGISTRATION },
      orderBy: { createdAt: 'desc' },
    });
    assert(
      authChallenge,
      'No registration challenge found',
      ErrorCode.VALIDATION_ERROR,
    );

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge: authChallenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    assert(
      registrationInfo,
      'Invalid registration response',
      ErrorCode.VALIDATION_ERROR,
    );

    await this.prisma.passkey.create({
      data: {
        id: registrationInfo.credential.id,
        user: { connect: { id: user.id } },
        publicKey: registrationInfo.credential.publicKey,
        counter: registrationInfo.credential.counter,
        transports: registrationInfo.credential.transports || [],
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        webAuthnUserID: user.id,
      },
    });

    return verified;
  }

  async generateAuthenticationOptions(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { passkeys: true },
    });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);

    const options: PublicKeyCredentialRequestOptionsJSON =
      await generateAuthenticationOptions({
        rpID,
        allowCredentials: user.passkeys.map((passkey) => ({
          id: passkey.id,
          transports: passkey.transports as AuthenticatorTransportFuture[],
        })),
      });

    await this.prisma.webAuthnChallenge.create({
      data: {
        userId: user.id,
        type: ChallengeType.AUTHENTICATION,
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return options;
  }

  async verifyAuthenticationResponseMethod(
    username: string,
    response: AuthenticationResponseJSON,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    assert(user, `User ${username} not found`, ErrorCode.USER_NOT_FOUND);

    const authChallenge = await this.prisma.webAuthnChallenge.findFirst({
      where: { userId: user.id, type: ChallengeType.AUTHENTICATION },
      orderBy: { createdAt: 'desc' },
    });
    assert(
      authChallenge,
      'No authentication challenge found',
      ErrorCode.VALIDATION_ERROR,
    );

    const passkey = await this.prisma.passkey.findFirst({
      where: { userId: user.id, id: response.id },
    });
    assert(
      passkey,
      `Could not find passkey ${response.id} for user ${user.id}`,
      ErrorCode.PASSKEY_NOT_FOUND,
    );

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: authChallenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.id,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports:
          (passkey.transports as AuthenticatorTransportFuture[]) || [],
      },
    });

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
      await this.prisma.passkey.update({
        where: { id: passkey.id },
        data: { counter: authenticationInfo.newCounter },
      });
    }

    return { verified };
  }

  async register(payload: RegisterUserPayload) {
    const { username, email, phoneNumber, password } = payload;
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    assert(
      !existingUsername,
      'Username already exists',
      ErrorCode.USER_ALREADY_EXISTS,
    );
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      assert(
        !existingEmail,
        'Email already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    if (phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });
      assert(
        !existingPhone,
        'Phone number already exists',
        ErrorCode.PHONE_ALREADY_EXISTS,
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.create({
      data: {
        username,
        email,
        phoneNumber,
        password: hashedPassword,
      },
    });
    return {
      message: 'user register successfully',
    };
  }

  async login(payload: LoginUserPayload) {
    const user = await this.prisma.user.findUnique({
      where: { username: payload.username },
    });
    assert(user, 'Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
    assert(user.password, 'Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
    const isPasswordValid = await bcrypt.compare(
      payload.password,
      user.password,
    );
    assert(
      isPasswordValid,
      'Invalid credentials',
      ErrorCode.INVALID_CREDENTIALS,
    );

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        lastActivity: new Date(),
        expiresAt: new Date(
          Date.now() + ms(process.env.SESSION_INACTIVITY_TIMEOUT || '30m'),
        ),
      },
    });
    return { sessionId: session.id };
  }
}
