export interface CreateConnectionDto {
  targetUsername: string;
}

export interface UpdateConnectionDto {
  status: 'accepted' | 'rejected';
}
