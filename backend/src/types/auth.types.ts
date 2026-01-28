export interface ILoginReply {
  token?: string;
  twoFARequired?: boolean;
  user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    is2FAEnabled: boolean;
  };
}

export interface ILogin2FABody {
  email: string;
  token: string;
}
