export interface IFriendBase {
  id: number;
  userId: number;
  friendId: number;
  accepted: boolean;
  createdAt: string;
}

export interface ISendFriendRequestBody {
  username: string;
}

export interface IFriendReply {
  message: string;
  id?: number;
}

export interface IFriendsListReply {
  friends: IFriendBase[];
}

export interface IPendingInvitesReply {
  incoming: IFriendBase[];
  outgoing: IFriendBase[];
}
