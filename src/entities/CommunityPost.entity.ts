import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Comment } from './Comment.entity';
import { PostLike } from './PostLike.entity';

@Entity('community_posts')
@Index(['userId'])
@Index(['createdAt'])
@Index(['isDeleted'])
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_anonymous', type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'text', array: true, default: [] })
  tags!: string[];

  @Column({ name: 'media_urls', type: 'text', array: true, default: [] })
  mediaUrls!: string[];

  @Column({ name: 'like_count', type: 'int', default: 0 })
  likeCount!: number;

  @Column({ name: 'comment_count', type: 'int', default: 0 })
  commentCount!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.communityPosts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes!: PostLike[];

  // Virtual property
  isLikedByMe?: boolean;

  isMine?: boolean;
}

