export interface IUserBody {
  user: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface IUserReply {
  user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface IUpdateUserBody {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface IChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}
