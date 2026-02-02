import { Response, NextFunction } from 'express';
import { JournalService } from '../services/journal.service';
import { AuthRequest } from '../middleware/auth';
import { PenguinStateService } from '../services/penguinState.service';
import { PenguinIntelligenceService } from '../services/penguinIntelligence.service';

export class JournalController {
  // List journals
  static async listJournals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const {
        startDate,
        endDate,
        entryType,
        page,
        per_page,
      } = req.query;

      const result = await JournalService.listJournals(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        entryType: entryType as 'text' | 'voice' | undefined,
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

  // Get journal by ID
  static async getJournal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const journal = await JournalService.getJournalById(id, userId);

      res.status(200).json({
        success: true,
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create journal
  static async createJournal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const {
        title,
        content,
        entryType,
        voiceRecordingUrl,
        transcriptionText,
        moodTags,
        mediaUrls,
      } = req.body;

      const journal = await JournalService.createJournal(userId, {
        title,
        content,
        entryType,
        voiceRecordingUrl,
        transcriptionText,
        moodTags: Array.isArray(moodTags) ? moodTags : [],
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      });

      // Get penguin state for response
      const penguinState = await PenguinStateService.getOrCreateState(userId);
      const penguinMemory = await PenguinStateService.getOrCreateMemory(userId);

      res.status(201).json({
        success: true,
        data: journal,
        penguin: {
          state: {
            energy: penguinState.energy,
            mood: penguinState.mood,
            trust: penguinState.trust,
          },
          memory: {
            dominantEmotion: penguinMemory.dominantEmotion,
            weekAvgMood: penguinMemory.weekAvgMood,
            talkPreference: penguinMemory.talkPreference,
          },
        },
        message: 'Journal created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update journal
  static async updateJournal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { title, content, moodTags, transcriptionText } = req.body;

      const journal = await JournalService.updateJournal(id, userId, {
        title,
        content,
        moodTags: Array.isArray(moodTags) ? moodTags : undefined,
        transcriptionText,
      });

      res.status(200).json({
        success: true,
        data: journal,
        message: 'Journal updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete journal
  static async deleteJournal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      await JournalService.deleteJournal(id, userId);

      res.status(200).json({
        success: true,
        message: 'Journal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload media to journal
  static async uploadMedia(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const file = req.file;

      if (!file) {
        throw new Error('No file uploaded');
      }

      const result = await JournalService.uploadMedia(id, userId, file);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Media uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get timeline
  static async getTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { startDate, endDate, entryType } = req.query;

      const timeline = await JournalService.getTimeline(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        entryType: entryType as 'text' | 'voice' | undefined,
      });

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }

  // Transcribe voice
  static async transcribeVoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        throw new Error('No audio file uploaded');
      }

      const result = await JournalService.transcribeVoice(file);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

