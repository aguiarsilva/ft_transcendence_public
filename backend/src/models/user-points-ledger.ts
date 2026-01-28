import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'user_points_ledger' })
export class UserPointsLedger {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'integer' })
  userId!: number;

  @Column({ type: 'integer' })
  points!: number; // positive or negative

  @Column({ type: 'varchar', length: 32 })
  reason!: string;

  @Column({ type: 'integer', nullable: true })
  sourceMatchId!: number | null;

  @Column({ type: 'integer', nullable: true })
  tournamentId!: number | null;

  @Column({ type: 'varchar', length: 16, default: 'default' })
  season!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
