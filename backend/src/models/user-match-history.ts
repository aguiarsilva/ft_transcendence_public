import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'user_match_history' })
export class UserMatchHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'integer' })
  userId!: number;

  @Column({ type: 'datetime' })
  playedAt!: Date;

  @Column({ type: 'varchar', length: 64 })
  opponentAlias!: string;

  @Column({ type: 'integer', nullable: true })
  opponentUserId!: number | null;

  @Column({ type: 'varchar', length: 16 })
  matchType!: 'tournament' | 'pvp' | 'ai';

  @Column({ type: 'varchar', length: 8 })
  result!: 'WIN' | 'LOSS';

  @Column({ type: 'integer' })
  userScore!: number;

  @Column({ type: 'integer' })
  opponentScore!: number;

  @Column({ type: 'integer', nullable: true })
  sourceMatchId!: number | null;

  @Column({ type: 'integer', nullable: true })
  tournamentId!: number | null;
}
