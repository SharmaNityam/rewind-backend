// Paws reward calculation service
// 20 paws per minute for exercises

export class PawsService {
  // Calculate paws for duration in seconds
  static calculatePaws(durationSeconds: number): number {
    const minutes = durationSeconds / 60;
    return Math.floor(minutes * 20);
  }

  // Format duration string (e.g., "5M", "25M")
  static formatDuration(durationSeconds: number): string {
    const minutes = Math.floor(durationSeconds / 60);
    return `${minutes}M`;
  }
}

