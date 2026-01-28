import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.js';

@Entity({ name: 'friends' })
export class Friend {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.sentFriendRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friend_id' })
  friend!: User;

  @Column({ type: 'boolean', default: false })
  accepted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
