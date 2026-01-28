import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.js';
import { TournamentPlayer } from './tournament-player.js';
import { TournamentMatch } from './tournament-match.js';

export type TournamentStatus = 'REGISTERING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', default: 'REGISTERING' })
  status!: TournamentStatus;

  @Column({ type: 'integer', nullable: true })
  maxPlayers!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser!: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  @OneToMany(() => TournamentPlayer, (p) => p.tournament)
  participants!: TournamentPlayer[];

  @OneToMany(() => TournamentMatch, (m) => m.tournament)
  matches!: TournamentMatch[];
}
