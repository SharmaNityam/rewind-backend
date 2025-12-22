import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntryType } from './enums';
import { User } from './User.entity';

@Entity('journals')
export class Journal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'entry_type', type: 'varchar', length: 20 })
  entryType: EntryType;

  @Column({ name: 'voice_recording_url', type: 'text', nullable: true })
  voiceRecordingUrl: string | null;

  @Column({ name: 'transcription_text', type: 'text', nullable: true })
  transcriptionText: string | null;

  @Column({ name: 'mood_tags', type: 'text', array: true, default: [] })
  moodTags: string[];

  @Column({ name: 'media_urls', type: 'text', array: true, default: [] })
  mediaUrls: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.journals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

