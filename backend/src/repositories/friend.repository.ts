import { Repository } from 'typeorm';
import { AppDataSource } from '../db.js';
import { Friend } from '../models/friend.js';
import { User } from '../models/user.js';

export class FriendRepository {
  private repo: Repository<Friend>;

  constructor() {
    this.repo = AppDataSource.getRepository(Friend);
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['user', 'friend'] });
  }

  findExistingBetween(a: number, b: number) {
    return this.repo.findOne({
      where: [
        { user: { id: a }, friend: { id: b } },
        { user: { id: b }, friend: { id: a } },
      ],
      relations: ['user', 'friend'],
    });
  }

  createRequest(userId: number, friendId: number) {
    return this.repo.create({
      user: { id: userId } as User,
      friend: { id: friendId } as User,
      accepted: false,
    });
  }

  save(entity: Friend) {
    return this.repo.save(entity);
  }

  remove(entity: Friend) {
    return this.repo.remove(entity);
  }

  listAccepted(userId: number) {
    return this.repo.find({
      where: [
        { user: { id: userId }, accepted: true },
        { friend: { id: userId }, accepted: true },
      ],
      relations: ['user', 'friend'],
    });
  }

  listPendingIncoming(userId: number) {
    return this.repo.find({
      where: { friend: { id: userId }, accepted: false },
      relations: ['user', 'friend'],
    });
  }

  listPendingOutgoing(userId: number) {
    return this.repo.find({
      where: { user: { id: userId }, accepted: false },
      relations: ['user', 'friend'],
    });
  }
}
