export class SendMessageDto {
  ciphertext!: string;
  iv?: string;
  authTag?: string;
  contentType?: string;
  version?: string;
}

export class HistoryQueryDto {
  cursor?: string; // messageId to paginate before
  limit?: number; // default 20
}
