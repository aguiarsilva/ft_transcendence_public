import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.js';

@Entity({ name: 'user_stats' })
export class UserStats {
  @PrimaryColumn({ name: 'user_id', type: 'integer' })
  userId!: number;

  @OneToOne(() => User, (user) => user.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'integer', default: 0 })
  wins!: number;

  @Column({ type: 'integer', default: 0 })
  losses!: number;

  @Column({ type: 'datetime', name: 'last_played', nullable: true })
  lastPlayed!: Date | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
