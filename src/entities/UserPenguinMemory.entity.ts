import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity('user_penguin_memories')
export class UserPenguinMemory {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'week_avg_mood', type: 'float', nullable: true })
  weekAvgMood: number | null;

  @Column({ name: 'dominant_emotion', type: 'varchar', length: 50, nullable: true })
  dominantEmotion: string | null;

  @Column({ name: 'talk_preference', type: 'varchar', length: 50, nullable: true })
  talkPreference: string | null;

  @Column({ name: 'last_updated', type: 'timestamp', nullable: true })
  lastUpdated: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
