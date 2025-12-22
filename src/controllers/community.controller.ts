import { Response, NextFunction } from 'express';
import { CommunityService } from '../services/community.service';
import { AuthRequest, optionalAuthenticate } from '../middleware/auth';

export class CommunityController {
  // List posts
  static async listPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tag, page, per_page } = req.query;

      const result = await CommunityService.listPosts({
        tag: tag as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get post by ID
  static async getPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const post = await CommunityService.getPostById(id);

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create post
  static async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || null;
      const { content, isAnonymous, tags, mediaUrls } = req.body;

      const post = await CommunityService.createPost(userId, {
        content,
        isAnonymous: Boolean(isAnonymous),
        tags: Array.isArray(tags) ? tags : [],
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      });

      res.status(201).json({
        success: true,
        data: post,
        message: 'Post created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update post
  static async updatePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { content, tags } = req.body;

      const post = await CommunityService.updatePost(id, userId, {
        content,
        tags: Array.isArray(tags) ? tags : undefined,
      });

      res.status(200).json({
        success: true,
        data: post,
        message: 'Post updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete post
  static async deletePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      await CommunityService.deletePost(id, userId);

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Like/unlike post
  static async toggleLike(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const result = await CommunityService.toggleLike(id, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: result.liked ? 'Post liked' : 'Post unliked',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get post comments
  static async getPostComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page, per_page } = req.query;

      const result = await CommunityService.getPostComments(
        id,
        page ? parseInt(page as string, 10) : 1,
        per_page ? parseInt(per_page as string, 10) : 20
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // Add comment
  static async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { commentText } = req.body;

      const comment = await CommunityService.addComment(id, userId, {
        commentText,
      });

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update comment
  static async updateComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { commentText } = req.body;

      const comment = await CommunityService.updateComment(id, userId, commentText);

      res.status(200).json({
        success: true,
        data: comment,
        message: 'Comment updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete comment
  static async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      await CommunityService.deleteComment(id, userId);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available tags
  static async getTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tags = await CommunityService.getAvailableTags();

      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's posts
  static async getUserPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page, per_page } = req.query;

      const result = await CommunityService.getUserPosts(
        id,
        page ? parseInt(page as string, 10) : 1,
        per_page ? parseInt(per_page as string, 10) : 20
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

