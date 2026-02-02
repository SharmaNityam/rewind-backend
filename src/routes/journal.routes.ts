import { Router } from 'express';
import { body, query } from 'express-validator';
import { JournalController } from '../controllers/journal.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { uploadSingle } from '../middleware/upload';
import { validateUUID } from '../middleware/uuidValidator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List journals
router.get(
  '/',
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('entryType').optional().isIn(['text', 'voice']),
    query('page').optional().isInt({ min: 1 }),
    query('per_page').optional().isInt({ min: 1, max: 100 }),
  ]),
  JournalController.listJournals
);

// Get timeline (must be before /:id route)
router.get(
  '/timeline',
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('entryType').optional().isIn(['text', 'voice']),
  ]),
  JournalController.getTimeline
);

// Transcribe voice (must be before /:id route)
router.post(
  '/voice/transcribe',
  uploadSingle('audio'),
  JournalController.transcribeVoice
);

// Get journal by ID
router.get('/:id', validateUUID('id'), JournalController.getJournal);

// Create journal
router.post(
  '/',
  validate([
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('entryType')
      .isIn(['text', 'voice'])
      .withMessage('Entry type must be text or voice'),
    body('voiceRecordingUrl').optional().isURL(),
    body('transcriptionText').optional().trim(),
    body('moodTags').optional().isArray(),
    body('mediaUrls').optional().isArray(),
  ]),
  JournalController.createJournal
);

// Update journal
router.put(
  '/:id',
  validateUUID('id'),
  validate([
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('moodTags').optional().isArray(),
    body('transcriptionText').optional().trim(),
  ]),
  JournalController.updateJournal
);

// Delete journal
router.delete('/:id', validateUUID('id'), JournalController.deleteJournal);

// Upload media to journal
router.post(
  '/:id/media',
  validateUUID('id'),
  uploadSingle('media'),
  JournalController.uploadMedia
);

export default router;

