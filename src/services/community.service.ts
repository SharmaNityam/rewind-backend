import { AppDataSource } from '../config/typeorm';
import { CommunityPost, Comment, PostLike, User } from '../entities';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { FileStorageService } from './fileStorage.service';
import { Repository, Like } from 'typeorm';

export interface CreatePostData {
  content: string;
  isAnonymous: boolean;
  tags?: string[];
  mediaUrls?: string[];
}

export interface UpdatePostData {
  content?: string;
  tags?: string[];
}

export interface CreateCommentData {
  commentText: string;
}

export interface PostFilters {
  tag?: string;
  page?: number;
  perPage?: number;
}

export class CommunityService {
  private static getPostRepository(): Repository<CommunityPost> {
    return AppDataSource.getRepository(CommunityPost);
  }

  private static getCommentRepository(): Repository<Comment> {
    return AppDataSource.getRepository(Comment);
  }

  private static getLikeRepository(): Repository<PostLike> {
    return AppDataSource.getRepository(PostLike);
  }

  private static getUserRepository(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  // List posts with pagination and filtering
  static async listPosts(filters: PostFilters = {}) {
    const postRepo = this.getPostRepository();
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const skip = (page - 1) * perPage;

    const where: any = {
      isDeleted: false,
    };

    if (filters.tag) {
      // TypeORM array contains check
      where.tags = Like(`%${filters.tag}%`);
    }

    const [posts, total] = await Promise.all([
      postRepo.find({
        where,
        skip,
        take: perPage,
        order: { createdAt: 'DESC' },
        relations: ['user'],
      }),
      postRepo.count({ where }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNext: page * perPage < total,
        hasPrev: page > 1,
      },
    };
  }

  // Get post by ID
  static async getPostById(postId: string) {
    const postRepo = this.getPostRepository();
    const post = await postRepo.findOne({
      where: {
        id: postId,
        isDeleted: false,
      },
      relations: ['user'],
    });

    if (!post) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    return post;
  }

  // Create post
  static async createPost(userId: string, data: CreatePostData) {
    const postRepo = this.getPostRepository();
    const userRepo = this.getUserRepository();

    const post = postRepo.create({
      userId: data.isAnonymous ? null : userId,
      content: data.content,
      isAnonymous: data.isAnonymous,
      tags: data.tags || [],
      mediaUrls: data.mediaUrls || [],
    });

    const saved = await postRepo.save(post);

    // Update user's total posts count
    if (!data.isAnonymous) {
      const user = await userRepo.findOne({ where: { id: userId } });
      if (user) {
        user.totalPosts += 1;
        await userRepo.save(user);
      }
    }

    logger.info(`Post created: ${saved.id} by user: ${userId}`);

    return saved;
  }

  // Update post
  static async updatePost(postId: string, userId: string, data: UpdatePostData) {
    const postRepo = this.getPostRepository();

    const existing = await postRepo.findOne({
      where: {
        id: postId,
        userId,
        isDeleted: false,
      },
    });

    if (!existing) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    Object.assign(existing, {
      content: data.content ?? existing.content,
      tags: data.tags ?? existing.tags,
    });

    const updated = await postRepo.save(existing);
    logger.info(`Post updated: ${postId} by user: ${userId}`);

    return updated;
  }

  // Delete post
  static async deletePost(postId: string, userId: string) {
    const postRepo = this.getPostRepository();
    const userRepo = this.getUserRepository();

    const post = await postRepo.findOne({
      where: {
        id: postId,
        userId,
        isDeleted: false,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    // Soft delete
    post.isDeleted = true;
    await postRepo.save(post);

    // Update user's total posts count
    const user = await userRepo.findOne({ where: { id: userId } });
    if (user) {
      user.totalPosts = Math.max(0, user.totalPosts - 1);
      await userRepo.save(user);
    }

    logger.info(`Post deleted: ${postId} by user: ${userId}`);
  }

  // Like/unlike post
  static async toggleLike(postId: string, userId: string) {
    const postRepo = this.getPostRepository();
    const likeRepo = this.getLikeRepository();

    const post = await postRepo.findOne({
      where: {
        id: postId,
        isDeleted: false,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    const existingLike = await likeRepo.findOne({
      where: {
        postId,
        userId,
      },
    });

    if (existingLike) {
      // Unlike
      await likeRepo.remove(existingLike);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await postRepo.save(post);
      return { liked: false, likeCount: post.likeCount };
    } else {
      // Like
      const like = likeRepo.create({
        postId,
        userId,
      });
      await likeRepo.save(like);
      post.likeCount += 1;
      await postRepo.save(post);
      return { liked: true, likeCount: post.likeCount };
    }
  }

  // Add comment
  static async addComment(postId: string, userId: string, data: CreateCommentData) {
    const postRepo = this.getPostRepository();
    const commentRepo = this.getCommentRepository();

    const post = await postRepo.findOne({
      where: {
        id: postId,
        isDeleted: false,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    const comment = commentRepo.create({
      postId,
      userId,
      commentText: data.commentText,
    });

    const saved = await commentRepo.save(comment);

    // Update post comment count
    post.commentCount += 1;
    await postRepo.save(post);

    logger.info(`Comment added to post: ${postId} by user: ${userId}`);

    return saved;
  }

  // Get post comments
  static async getPostComments(postId: string, page: number = 1, perPage: number = 20) {
    const commentRepo = this.getCommentRepository();
    const skip = (page - 1) * perPage;

    const [comments, total] = await Promise.all([
      commentRepo.find({
        where: {
          postId,
          isDeleted: false,
        },
        skip,
        take: perPage,
        order: { createdAt: 'DESC' },
        relations: ['user'],
      }),
      commentRepo.count({
        where: {
          postId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      data: comments,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNext: page * perPage < total,
        hasPrev: page > 1,
      },
    };
  }

  // Update comment
  static async updateComment(commentId: string, userId: string, commentText: string) {
    const commentRepo = this.getCommentRepository();

    const existing = await commentRepo.findOne({
      where: {
        id: commentId,
        userId,
        isDeleted: false,
      },
    });

    if (!existing) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    existing.commentText = commentText;
    const updated = await commentRepo.save(existing);

    logger.info(`Comment updated: ${commentId} by user: ${userId}`);

    return updated;
  }

  // Delete comment
  static async deleteComment(commentId: string, userId: string) {
    const commentRepo = this.getCommentRepository();
    const postRepo = this.getPostRepository();

    const existing = await commentRepo.findOne({
      where: {
        id: commentId,
        userId,
        isDeleted: false,
      },
      relations: ['post'],
    });

    if (!existing) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    // Soft delete
    existing.isDeleted = true;
    await commentRepo.save(existing);

    // Update post comment count
    const post = await postRepo.findOne({ where: { id: existing.postId } });
    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
      await postRepo.save(post);
    }

    logger.info(`Comment deleted: ${commentId} by user: ${userId}`);
  }

  // Get posts by tag
  static async getPostsByTag(tag: string, page: number = 1, perPage: number = 20) {
    return this.listPosts({ tag, page, perPage });
  }

  // Get available tags
  static async getAvailableTags(): Promise<string[]> {
    const postRepo = this.getPostRepository();
    
    // Get all unique tags from non-deleted posts
    const posts = await postRepo.find({
      where: { isDeleted: false },
      select: ['tags'],
    });

    // Extract all tags and get unique values
    const allTags = new Set<string>();
    posts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag.toLowerCase().trim());
          }
        });
      }
    });

    // Return sorted unique tags
    return Array.from(allTags).sort();
  }

  // Get posts by user ID
  static async getUserPosts(userId: string, page: number = 1, perPage: number = 20) {
    const postRepo = this.getPostRepository();
    const skip = (page - 1) * perPage;

    const [posts, total] = await postRepo.findAndCount({
      where: {
        userId,
        isDeleted: false,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: perPage,
      relations: ['user'],
    });

    return {
      data: posts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
