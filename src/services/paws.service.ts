// Paws reward calculation service
// 20 paws per minute for exercises

export class PawsService {
  // Calculate paws for duration in seconds
  static calculatePaws(durationSeconds: number): number {
    const minutes = durationSeconds / 60;
    return Math.floor(minutes * 20);
  }

  // Calculate paws for breathing exercises (20 paws per minute)
  static calculateBreathingPaws(durationSeconds: number): number {
    return this.calculatePaws(durationSeconds);
  }

  // Calculate paws for meditation sessions (20 paws per minute)
  static calculateMeditationPaws(durationSeconds: number): number {
    return this.calculatePaws(durationSeconds);
  }

  // Format duration string (e.g., "5M", "25M")
  static formatDuration(durationSeconds: number): string {
    const minutes = Math.floor(durationSeconds / 60);
    return `${minutes}M`;
  }
}

