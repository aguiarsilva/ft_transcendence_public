import { AppDataSource } from '../db.js';
import { User } from '../models/user.js';

const userRepo = AppDataSource.getRepository(User);

export class UserRepository {
  async findById(id: string | number): Promise<User | null> {
    return await userRepo.findOneBy({ id: Number(id) });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await userRepo.findOneBy({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await userRepo.findOneBy({ username });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = userRepo.create(data);
    return await userRepo.save(user);
  }

  async update(user: User): Promise<User> {
    return await userRepo.save(user);
  }

  async updatePassword(userId: string | number, newPassword: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    user.password = newPassword;
    return await userRepo.save(user);
  }

  async incrementIncomingInvites(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    user.incomingFriendInvitesCount = (user.incomingFriendInvitesCount || 0) + 1;
    await userRepo.save(user);
  }

  async decrementIncomingInvites(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    user.incomingFriendInvitesCount = Math.max(0, (user.incomingFriendInvitesCount || 0) - 1);
    await userRepo.save(user);
  }

  async generateUniqueUsername(base: string): Promise<string> {
    let username = base;
    let i = 1;
    while (await this.findByUsername(username)) {
      username = `${base}${i}`;
      i++;
    }
    return username;
  }
}
