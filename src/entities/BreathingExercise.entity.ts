import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity('breathing_exercises')
export class BreathingExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'duration_seconds', type: 'int' })
  durationSeconds: number;

  @Column({ name: 'duration_string', type: 'varchar', length: 10 })
  durationString: string;

  @Column({ name: 'paws_earned', type: 'int' })
  pawsEarned: number;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;

  @ManyToOne(() => User, (user) => user.breathingExercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

