import { Router } from 'express';
import { body, query } from 'express-validator';
import { CommunityController } from '../controllers/community.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { validateUUID } from '../middleware/uuidValidator';

const router = Router();

// List posts (optional auth for viewing)
router.get(
  '/posts',
  authenticate,
  validate([
    query('tag').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('per_page').optional().isInt({ min: 1, max: 100 }),
  ]),
  CommunityController.listPosts
);

// Get post by ID (optional auth)
router.get('/posts/:id', authenticate, validateUUID('id'), CommunityController.getPost);

// Create post (requires auth)
router.post(
  '/posts',
  authenticate,
  validate([
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('isAnonymous').isBoolean().withMessage('isAnonymous must be a boolean'),
    body('tags').optional().isArray(),
    body('mediaUrls').optional().isArray(),
  ]),
  CommunityController.createPost
);

// Update post (requires auth)
router.put(
  '/posts/:id',
  authenticate,
  validateUUID('id'),
  validate([
    body('content').optional().trim().notEmpty(),
    body('tags').optional().isArray(),
  ]),
  CommunityController.updatePost
);

// Delete post (requires auth)
router.delete('/posts/:id', authenticate, validateUUID('id'), CommunityController.deletePost);

// Like/unlike post (requires auth)
router.post('/posts/:id/like', authenticate, validateUUID('id'), CommunityController.toggleLike);

// Get post comments (optional auth)
router.get(
  '/posts/:id/comments',
  authenticate,
  validateUUID('id'),
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('per_page').optional().isInt({ min: 1, max: 100 }),
  ]),
  CommunityController.getPostComments
);

// Add comment (requires auth)
router.post(
  '/posts/:id/comments',
  authenticate,
  validateUUID('id'),
  validate([
    body('commentText').trim().notEmpty().withMessage('Comment text is required'),
  ]),
  CommunityController.addComment
);

// Update comment (requires auth)
router.put(
  '/comments/:id',
  authenticate,
  validateUUID('id'),
  validate([
    body('commentText').trim().notEmpty().withMessage('Comment text is required'),
  ]),
  CommunityController.updateComment
);

// Delete comment (requires auth)
router.delete('/comments/:id', authenticate, validateUUID('id'), CommunityController.deleteComment);

// Get available tags (no auth required)
router.get('/tags', CommunityController.getTags);

// Get user's posts (optional auth)
router.get(
  '/users/:id/posts',
  authenticate,
  validateUUID('id'),
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('per_page').optional().isInt({ min: 1, max: 100 }),
  ]),
  CommunityController.getUserPosts
);

export default router;

