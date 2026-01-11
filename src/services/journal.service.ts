import { AppDataSource } from '../config/typeorm';
import { Journal, EntryType } from '../entities';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { FileStorageService } from './fileStorage.service';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { PenguinIntelligenceService } from './penguinIntelligence.service';
import { PenguinStateService } from './penguinState.service';

export interface CreateJournalData {
  title: string;
  content: string;
  entryType: 'text' | 'voice';
  voiceRecordingUrl?: string;
  transcriptionText?: string;
  moodTags?: string[];
  mediaUrls?: string[];
}

export interface UpdateJournalData {
  title?: string;
  content?: string;
  moodTags?: string[];
  transcriptionText?: string;
}

export interface JournalFilters {
  startDate?: Date;
  endDate?: Date;
  entryType?: 'text' | 'voice';
  page?: number;
  perPage?: number;
}

export class JournalService {
  private static getJournalRepository(): Repository<Journal> {
    return AppDataSource.getRepository(Journal);
  }

  // List journals with pagination and filtering
  static async listJournals(userId: string, filters: JournalFilters = {}) {
    const journalRepo = this.getJournalRepository();
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const skip = (page - 1) * perPage;

    const where: any = { userId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt = MoreThanOrEqual(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt = LessThanOrEqual(filters.endDate);
      }
    }

    if (filters.entryType) {
      where.entryType = filters.entryType;
    }

    const [journals, total] = await Promise.all([
      journalRepo.find({
        where,
        skip,
        take: perPage,
        order: { createdAt: 'DESC' },
      }),
      journalRepo.count({ where }),
    ]);

    return {
      data: journals,
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

  // Get journal by ID
  static async getJournalById(journalId: string, userId: string) {
    const journalRepo = this.getJournalRepository();
    const journal = await journalRepo.findOne({
      where: {
        id: journalId,
        userId,
      },
    });

    if (!journal) {
      throw new AppError('Journal not found', 404, 'JOURNAL_NOT_FOUND');
    }

    return journal;
  }

  // Create journal
  static async createJournal(userId: string, data: CreateJournalData) {
    const journalRepo = this.getJournalRepository();
    const journal = journalRepo.create({
      userId,
      title: data.title,
      content: data.content,
      entryType: data.entryType as EntryType,
      voiceRecordingUrl: data.voiceRecordingUrl,
      transcriptionText: data.transcriptionText,
      moodTags: data.moodTags || [],
      mediaUrls: data.mediaUrls || [],
    });

    const saved = await journalRepo.save(journal);
    logger.info(`Journal created: ${saved.id} by user: ${userId}`);

    // Integrate with Penguin Intelligence Service
    try {
      const penguinService = new PenguinIntelligenceService();
      const penguinState = await PenguinStateService.getOrCreateState(userId);
      const daysInactive = await PenguinStateService.calculateDaysInactive(userId);
      const timeOfDay = PenguinStateService.getTimeOfDay();

      const penguinResponse = await penguinService.infer({
        type: 'journal',
        content: data.content,
        explicit_request: false,
        context: {
          time_of_day: timeOfDay,
          days_inactive: daysInactive,
          last_policy: null, // Could store last policy in memory
          state: {
            energy: penguinState.energy,
            mood: penguinState.mood,
            trust: penguinState.trust,
          },
        },
        user_id: userId,
      });

      // Apply state delta
      await PenguinStateService.applyDelta(userId, penguinResponse.penguin_state_delta);

      // Update memory with dominant emotion
      if (penguinResponse.emotion.primary) {
        await PenguinStateService.updateMemory(userId, {
          dominantEmotion: penguinResponse.emotion.primary,
        });
      }

      logger.info(`Penguin response generated for journal: ${saved.id}`, {
        emotion: penguinResponse.emotion.primary,
        policy: penguinResponse.behavior_policy,
      });

      // Store penguin response in journal metadata (optional - could add field to Journal entity)
      // For now, we'll return it separately in the controller
    } catch (error) {
      logger.error('Failed to get penguin response for journal', {
        journalId: saved.id,
        error,
      });
      // Don't fail journal creation if penguin service fails
    }

    return saved;
  }

  // Update journal
  static async updateJournal(
    journalId: string,
    userId: string,
    data: UpdateJournalData
  ) {
    const journalRepo = this.getJournalRepository();

    // Verify ownership
    const existing = await journalRepo.findOne({
      where: {
        id: journalId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Journal not found', 404, 'JOURNAL_NOT_FOUND');
    }

    Object.assign(existing, {
      title: data.title ?? existing.title,
      content: data.content ?? existing.content,
      moodTags: data.moodTags ?? existing.moodTags,
      transcriptionText: data.transcriptionText ?? existing.transcriptionText,
    });

    const updated = await journalRepo.save(existing);
    logger.info(`Journal updated: ${journalId} by user: ${userId}`);

    return updated;
  }

  // Delete journal
  static async deleteJournal(journalId: string, userId: string) {
    const journalRepo = this.getJournalRepository();

    // Verify ownership
    const existing = await journalRepo.findOne({
      where: {
        id: journalId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Journal not found', 404, 'JOURNAL_NOT_FOUND');
    }

    // Delete associated media files
    if (existing.mediaUrls && existing.mediaUrls.length > 0) {
      for (const mediaUrl of existing.mediaUrls) {
        try {
          await FileStorageService.deleteFile(mediaUrl);
        } catch (error) {
          logger.error(`Failed to delete media file: ${mediaUrl}`, {
            mediaUrl,
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            } : error
          });
        }
      }
    }

    if (existing.voiceRecordingUrl) {
      try {
        await FileStorageService.deleteFile(existing.voiceRecordingUrl);
      } catch (error) {
        logger.error(
          `Failed to delete voice recording: ${existing.voiceRecordingUrl}`,
          {
            voiceRecordingUrl: existing.voiceRecordingUrl,
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            } : error
          }
        );
      }
    }

    await journalRepo.remove(existing);
    logger.info(`Journal deleted: ${journalId} by user: ${userId}`);
  }

  // Upload media to journal
  static async uploadMedia(
    journalId: string,
    userId: string,
    file: Express.Multer.File
  ) {
    const journalRepo = this.getJournalRepository();

    // Verify ownership
    const journal = await journalRepo.findOne({
      where: {
        id: journalId,
        userId,
      },
    });

    if (!journal) {
      throw new AppError('Journal not found', 404, 'JOURNAL_NOT_FOUND');
    }

    // Save file
    const filePath = await FileStorageService.saveFile(file, 'journals');
    const fileUrl = await FileStorageService.getFileUrl(filePath);

    // Update journal with new media URL
    const updatedMediaUrls = [...(journal.mediaUrls || []), fileUrl];
    journal.mediaUrls = updatedMediaUrls;

    const updated = await journalRepo.save(journal);
    logger.info(`Media uploaded to journal: ${journalId}`);

    return {
      journal: updated,
      mediaUrl: fileUrl,
    };
  }

  // Get timeline view (grouped by date)
  static async getTimeline(userId: string, filters: JournalFilters = {}) {
    const journalRepo = this.getJournalRepository();
    const where: any = { userId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt = MoreThanOrEqual(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt = LessThanOrEqual(filters.endDate);
      }
    }

    if (filters.entryType) {
      where.entryType = filters.entryType;
    }

    const journals = await journalRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    // Group by date
    const timeline: Record<string, Journal[]> = {};

    journals.forEach((journal) => {
      const dateKey = journal.createdAt.toISOString().split('T')[0];
      if (!timeline[dateKey]) {
        timeline[dateKey] = [];
      }
      timeline[dateKey].push(journal);
    });

    return timeline;
  }

  // Transcribe voice recording (mock implementation)
  static async transcribeVoice(
    file: Express.Multer.File
  ): Promise<{ transcription: string }> {
    // In production, integrate with AWS Transcribe, Google Speech-to-Text, etc.
    logger.info('Voice transcription requested (mock)');

    return {
      transcription:
        'This is a mock transcription. In production, this would be generated by a speech-to-text service.',
    };
  }
}
