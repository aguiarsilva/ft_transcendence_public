import { Friend } from '../models/friend.js';
import { User } from '../models/user.js';
import { AppDataSource } from '../db.js';
import { FriendRepository } from '../repositories/friend.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ISendFriendRequestBody, IFriendBase } from '../types/friend.types.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';

export class FriendService {
  private userRepo: ReturnType<typeof AppDataSource.getRepository>;
  private friendRepoEx: FriendRepository;
  private userRepoUtil: UserRepository;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.friendRepoEx = new FriendRepository();
    this.userRepoUtil = new UserRepository();
  }

  async sendFriendRequest(userId: number, body: ISendFriendRequestBody): Promise<{ message: string; id: number }> {
    const username = body.username?.trim();
    if (!username) {
      throw new AppError('Username is required', HTTP_STATUS.BAD_REQUEST);
    }

    const target = await this.userRepo.findOneBy({ username });
    if (!target) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }
    if (userId === target.id) {
      throw new AppError('Cannot send friend request to yourself', HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await this.friendRepoEx.findExistingBetween(userId, target.id);
    if (existing) {
      if (existing.accepted) throw new AppError('Already friends', HTTP_STATUS.CONFLICT);
      throw new AppError('Friend request already exists', HTTP_STATUS.CONFLICT);
    }

    const request = this.friendRepoEx.createRequest(userId, target.id);
    await this.friendRepoEx.save(request);
    await this.userRepoUtil.incrementIncomingInvites(target.id);

    return { message: 'Friend request sent', id: request.id };
  }

  async acceptFriendRequest(userId: number, requestId: number): Promise<{ message: string }> {
    const request = await this.friendRepoEx.findById(requestId);
    if (!request) throw new AppError('Friend request not found', HTTP_STATUS.NOT_FOUND);
    if (request.friend.id !== userId) throw new AppError('Only recipient can accept', HTTP_STATUS.FORBIDDEN);
    if (request.accepted) return { message: 'Already accepted' };

    request.accepted = true;
    await this.friendRepoEx.save(request);
    await this.userRepoUtil.decrementIncomingInvites(userId);
    return { message: 'Friend request accepted' };
  }

  async declineFriendRequest(userId: number, requestId: number): Promise<{ message: string }> {
    const request = await this.friendRepoEx.findById(requestId);
    if (!request) throw new AppError('Friend request not found', HTTP_STATUS.NOT_FOUND);
    if (request.friend.id !== userId) throw new AppError('Only recipient can decline', HTTP_STATUS.FORBIDDEN);

    await this.friendRepoEx.remove(request);
    await this.userRepoUtil.decrementIncomingInvites(userId);
    return { message: 'Friend request declined' };
  }

  async listFriends(userId: number): Promise<IFriendBase[]> {
    const friends = await this.friendRepoEx.listAccepted(userId);
    return friends.map((f) => ({
      id: f.id,
      userId: f.user.id,
      friendId: f.friend.id,
      accepted: f.accepted,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async listPendingInvites(userId: number): Promise<{ incoming: IFriendBase[]; outgoing: IFriendBase[] }> {
    const [incomingRows, outgoingRows] = await Promise.all([
      this.friendRepoEx.listPendingIncoming(userId),
      this.friendRepoEx.listPendingOutgoing(userId),
    ]);
    const toBase = (f: Friend): IFriendBase => ({
      id: f.id,
      userId: f.user.id,
      friendId: f.friend.id,
      accepted: f.accepted,
      createdAt: f.createdAt.toISOString(),
    });
    return {
      incoming: incomingRows.map(toBase),
      outgoing: outgoingRows.map(toBase),
    };
  }

  async deleteFriend(userId: number, friendRequestId: number): Promise<void> {
    const rel = await this.friendRepoEx.findById(friendRequestId);
    if (!rel) throw new AppError('Friend relationship not found', HTTP_STATUS.NOT_FOUND);
    if (rel.user.id !== userId && rel.friend.id !== userId) {
      throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
    }
    const wasIncoming = rel.friend.id === userId && !rel.accepted;
    await this.friendRepoEx.remove(rel);
    if (wasIncoming) {
      await this.userRepoUtil.decrementIncomingInvites(userId);
    }
  }

  async listFriendIds(userId: number): Promise<number[]> {
    const friends = await this.listFriends(userId);

    return friends.map(f => {
      return f.userId === userId ? f.friendId : f.userId;
    });
  }
}
