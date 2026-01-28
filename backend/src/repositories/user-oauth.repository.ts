import { AppDataSource } from '../db.js';
import { UserOAuth } from '../models/user-oauth.js';
import { User } from '../models/user.js';

const oauthRepo = AppDataSource.getRepository(UserOAuth);

export class UserOAuthRepository {
  async findByProviderAndId(provider: string, oauthId: string): Promise<UserOAuth | null> {
    return await oauthRepo.findOne({
      where: { provider, oauthId },
      relations: ['user'],
    });
  }

  async create(provider: string, oauthId: string, user: User): Promise<UserOAuth> {
    const oauthAccount = oauthRepo.create({ provider, oauthId, user });
    return await oauthRepo.save(oauthAccount);
  }

  async deleteById(id: number): Promise<void> {
    await oauthRepo.delete(id);
  }
}
