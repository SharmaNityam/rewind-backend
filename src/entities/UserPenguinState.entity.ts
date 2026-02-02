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

@Entity('user_penguin_states')
export class UserPenguinState {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ type: 'int', default: 50 })
  energy: number;

  @Column({ type: 'int', default: 50 })
  mood: number;

  @Column({ type: 'int', default: 50 })
  trust: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
