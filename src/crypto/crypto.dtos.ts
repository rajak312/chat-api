export class RegisterDeviceDto {
  name?: string;
  identityKey!: string; // public
  signedPreKey!: string; // public
  spkSignature!: string;
}

export class UploadPrekeysDto {
  keys!: { keyId: number; publicKey: string }[];
}

export class ClaimPrekeyDto {
  // empty; server chooses one unconsumed prekey
}
