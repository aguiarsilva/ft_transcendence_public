import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tournament } from './tournament.js';
import { TournamentPlayer } from './tournament-player.js';

export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';

@Entity()
export class TournamentMatch {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, (t) => t.matches, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament | null;

  @ManyToOne(() => TournamentPlayer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player1_participant_id' })
  player1!: TournamentPlayer;

  @ManyToOne(() => TournamentPlayer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player2_participant_id' })
  player2!: TournamentPlayer;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  orderIndex!: number;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: MatchStatus;

  @Column({ name: 'score_p1', type: 'integer', default: 0 })
  scoreP1!: number;

  @Column({ name: 'score_p2', type: 'integer', default: 0 })
  scoreP2!: number;

  @ManyToOne(() => TournamentPlayer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_participant_id' })
  winnerParticipant!: TournamentPlayer | null;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'datetime', nullable: true })
  finishedAt!: Date | null;
}
