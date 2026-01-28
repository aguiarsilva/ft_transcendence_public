import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Tournament } from './tournament.js';
import { User } from './user.js';

@Entity()
@Unique(['tournament', 'alias'])
export class TournamentPlayer {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, (t) => t.participants, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'varchar' })
  alias!: string;

  @Column({ type: 'integer', nullable: true })
  seed!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
