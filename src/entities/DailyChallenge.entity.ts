import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { UserChallengeCompletion } from './UserChallengeCompletion.entity';

@Entity('daily_challenges')
@Unique(['challengeDate'])
@Index(['challengeDate'])
export class DailyChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'challenge_text', type: 'text' })
  challengeText: string;

  @Column({ name: 'challenge_date', type: 'date', unique: true })
  challengeDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserChallengeCompletion, (completion) => completion.challenge)
  completions: UserChallengeCompletion[];
}

