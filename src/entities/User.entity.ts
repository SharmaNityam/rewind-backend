import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Gender } from './enums';
import { Journal } from './Journal.entity';
import { Goal } from './Goal.entity';
import { BreathingExercise } from './BreathingExercise.entity';
import { MeditationSession } from './MeditationSession.entity';
import { UserChallengeCompletion } from './UserChallengeCompletion.entity';
import { CommunityPost } from './CommunityPost.entity';
import { Comment } from './Comment.entity';
import { PostLike } from './PostLike.entity';
import { Notification } from './Notification.entity';
import { RefreshToken } from './RefreshToken.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'profile_image_url', type: 'text', nullable: true })
  profileImageUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: Gender | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ name: 'health_goal', type: 'varchar', length: 255, nullable: true })
  healthGoal: string | null;

  @Column({ name: 'seeking_professional_help', type: 'boolean', default: false })
  seekingProfessionalHelp: boolean;

  @Column({ name: 'paws_balance', type: 'int', default: 0 })
  pawsBalance: number;

  @Column({ name: 'total_posts', type: 'int', default: 0 })
  totalPosts: number;

  @Column({ name: 'onboarding_completed', type: 'boolean', default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Journal, (journal) => journal.user)
  journals: Journal[];

  @OneToMany(() => Goal, (goal) => goal.user)
  goals: Goal[];

  @OneToMany(() => BreathingExercise, (exercise) => exercise.user)
  breathingExercises: BreathingExercise[];

  @OneToMany(() => MeditationSession, (session) => session.user)
  meditationSessions: MeditationSession[];

  @OneToMany(() => UserChallengeCompletion, (completion) => completion.user)
  challengeCompletions: UserChallengeCompletion[];

  @OneToMany(() => CommunityPost, (post) => post.user)
  communityPosts: CommunityPost[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => PostLike, (like) => like.user)
  postLikes: PostLike[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}

