import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User.entity';
import { DailyChallenge } from './DailyChallenge.entity';

@Entity('user_challenge_completions')
@Unique(['userId', 'challengeId'])
export class UserChallengeCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'challenge_id', type: 'uuid' })
  challengeId: string;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;

  @ManyToOne(() => User, (user) => user.challengeCompletions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => DailyChallenge, (challenge) => challenge.completions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge: DailyChallenge;
}

