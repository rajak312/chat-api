export class CreateRoomDto {
  name!: string;
  isGroup!: boolean;
  members!: {
    userId: string;
    deviceId?: string | null;
    envelope?: {
      encryptedRoomKey: string;
      keyEnvelopeIV?: string;
      keyEnvelopeTag?: string;
      keyEnvelopeAlg?: string;
    } | null;
  }[];
}
