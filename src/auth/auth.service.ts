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

const rpName = process.env.RP_NAME || 'My NestJS App';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.WEB_APP_ORIGIN || 'http://localhost:3000';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async generateRegistrationOptions(username: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
      include: {
        passkeys: true,
      },
    });
    if (!user) return;
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
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    return options;
  }

  async verifyRegistrationResponse(
    userId: string,
    response: RegistrationResponseJSON,
  ) {
    const authChallenge = await this.prisma.webAuthnChallenge.findFirst({
      where: {
        userId,
        type: ChallengeType.REGISTRATION,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!authChallenge) return;
    const user = await this.prisma.user.findUnique({
      where: {
        id: authChallenge.userId,
      },
    });
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge: authChallenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!registrationInfo || !user) return;
    await this.prisma.passkey.create({
      data: {
        id: registrationInfo.credential.id,
        user: {
          connect: { id: user.id },
        },
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

    if (!user) return null;

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
        type: 'AUTHENTICATION',
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
    if (!user) {
      throw new Error(`User ${username} not found`);
    }
    const authChallenge = await this.prisma.webAuthnChallenge.findFirst({
      where: {
        userId: user.id,
        type: 'AUTHENTICATION',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (!authChallenge) {
      throw new Error('No authentication challenge found');
    }

    const passkey = await this.prisma.passkey.findFirst({
      where: {
        userId: user.id,
        id: response.id,
      },
    });
    if (!passkey) {
      throw new Error(
        `Could not find passkey ${response.id} for user ${user.id}`,
      );
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: authChallenge.challenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN!,
      expectedRPID: process.env.WEBAUTHN_RPID!,
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
}
