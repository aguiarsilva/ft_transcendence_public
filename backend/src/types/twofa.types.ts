export interface ITwoFASetupReply {
  otpauthUrl: string;
  secret: string;
}

export interface ITwoFAVerifyBody {
  token: string;
}

export interface ITwoFADisableBody {
  token: string;
}