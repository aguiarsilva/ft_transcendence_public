import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { IsEmail, Matches, Length, IsOptional } from 'class-validator';
import { getIsInvalidMessage } from '../helpers/user.helpers.js';
import * as bcrypt from 'bcrypt';
import { UserOAuth } from './user-oauth.js';
import { Friend } from './friend.js';
import { UserStats } from './user-stats.js';

@Entity()
@Unique(['email'])
@Unique(['username'])
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  @IsEmail(undefined, { message: getIsInvalidMessage('Email') })
  email!: string;

  @Column({ type: 'varchar' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/, {
    message: `${getIsInvalidMessage(
      'Password'
    )}. Use a password with at least 8 symbols, that includes at least 1 letter and a digit.`,
  })
  password!: string;

  @Column({ type: 'varchar' })
  @Length(1, 50, { message: getIsInvalidMessage('First Name') })
  firstName!: string;

  @Column({ type: 'varchar' })
  @Length(1, 50, { message: getIsInvalidMessage('Last Name') })
  lastName!: string;

  @Column({ type: 'varchar', unique: true })
  @Length(3, 20, { message: getIsInvalidMessage('Username') })
  username!: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  country!: string | null;

  @Column({ type: 'varchar', nullable: true, default: '/avatars/avatar.jpg' })
  @IsOptional()
  avatar!: string | null;

  @Column({ type: 'boolean', default: false })
  is2FAEnabled!: boolean;

  @Column({ type: 'varchar', nullable: true })
  twoFASecret!: string | null;

  @Column({ type: 'varchar', nullable: true })
  twoFATempSecret!: string | null;

  @Column({ type: 'int', default: 0 })
  incomingFriendInvitesCount!: number;

  cachedPassword!: string;

  @AfterLoad()
  cachePassword() {
    this.cachedPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.cachedPassword === this.password) return;
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }

  async isPasswordValid(inputPassword: string): Promise<boolean> {
    return await bcrypt.compare(inputPassword, this.password);
  }

  @OneToMany(() => UserOAuth, (oauth) => oauth.user)
  oauthAccounts!: UserOAuth[];

  @OneToMany(() => Friend, (friend) => friend.user)
  sentFriendRequests!: Friend[];

  @OneToMany(() => Friend, (friend) => friend.friend)
  receivedFriendRequests!: Friend[];

  @OneToOne(() => UserStats, (stats) => stats.user, { cascade: true })
  stats!: UserStats;
}
