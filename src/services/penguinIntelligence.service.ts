import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

export interface InferRequest {
  type: 'checkin' | 'journal' | 'message' | 'breathing' | 'silence';
  content: string | null;
  explicit_request: boolean;
  context: {
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
    days_inactive: number;
    last_policy: string | null;
    state: {
      energy: number;
      mood: number;
      trust: number;
    };
  };
  user_id?: string;
}

export interface InferResponse {
  emotion: {
    primary: string;
    intensity: number;
    confidence: number;
  };
  penguin_state_delta: {
    energy: number;
    mood: number;
    trust: number;
  };
  behavior_policy: string;
  text_response: string | null;
  explainability: {
    signals: string[];
    rule_triggered: string;
  };
}

export interface MemoryResponse {
  user_id: string;
  week_avg_mood: number | null;
  dominant_emotion: string | null;
  talk_preference: string | null;
  last_updated: string | null;
}

export class PenguinIntelligenceService {
  private client: AxiosInstance;
  private baseUrl: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = process.env.PENGUIN_SERVICE_URL || 'http://localhost:3001';
    this.enabled = process.env.PENGUIN_SERVICE_ENABLED !== 'false';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: parseInt(process.env.PENGUIN_SERVICE_TIMEOUT || '10000', 10),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get fallback response when Penguin service is unavailable
   */
  private getFallbackResponse(): InferResponse {
    return {
      emotion: {
        primary: 'neutral',
        intensity: 0,
        confidence: 0,
      },
      penguin_state_delta: { energy: 0, mood: 0, trust: 0 },
      behavior_policy: 'SILENT_COMPANION',
      text_response: "I'm here with you.",
      explainability: {
        signals: ['service_unavailable'],
        rule_triggered: 'fallback',
      },
    };
  }

  /**
   * Call Penguin Intelligence Service /infer endpoint
   */
  async infer(request: InferRequest): Promise<InferResponse> {
    if (!this.enabled) {
      logger.debug('Penguin Intelligence Service is disabled');
      return this.getFallbackResponse();
    }

    try {
      const response = await this.client.post<InferResponse>('/infer', request);
      logger.debug('Penguin inference successful', {
        emotion: response.data.emotion.primary,
        policy: response.data.behavior_policy,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Service responded with error status
        logger.error('Penguin Intelligence Service error', {
          status: axiosError.response.status,
          data: axiosError.response.data,
        });
      } else if (axiosError.request) {
        // Request made but no response
        logger.warn('Penguin Intelligence Service unavailable (no response)', {
          url: this.baseUrl,
        });
      } else {
        // Error setting up request
        logger.error('Penguin Intelligence Service request error', {
          message: axiosError.message,
        });
      }

      // Return fallback - don't break the main feature
      return this.getFallbackResponse();
    }
  }

  /**
   * Get user memory from Penguin service
   */
  async getMemory(userId: string): Promise<MemoryResponse | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get<MemoryResponse>(`/memory/${userId}`);
      return response.data;
    } catch (error) {
      logger.warn('Failed to get penguin memory', { userId, error });
      return null;
    }
  }

  /**
   * Apply state delta via Penguin service (optional - can also do locally)
   */
  async applyState(userId: string, delta: { energy: number; mood: number; trust: number }): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.client.post('/state/apply', {
        user_id: userId,
        delta,
      });
      return true;
    } catch (error) {
      logger.warn('Failed to apply state via Penguin service', { userId, error });
      return false;
    }
  }
}
