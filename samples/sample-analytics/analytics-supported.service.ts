import { inject, Injectable } from '@angular/core';
import { ANALYTICS_SUPPORTED } from '@qarapace/ngfire/analytics';
import { EventParams, logEvent } from 'firebase/analytics';

/**
 * Sample service demonstrating `ANALYTICS_SUPPORTED` usage.
 *
 * Injects a `Promise<Analytics | null>` that resolves once `isSupported()`
 * completes. This avoids blocking app startup while ensuring analytics is
 * only used in supported environments.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsSupportedService {
  private analyticsPromise = inject(ANALYTICS_SUPPORTED);

  private async log(event: string, params?: EventParams): Promise<void> {
    const analytics = await this.analyticsPromise;
    if (!analytics) return;
    logEvent(analytics, event, params);
  }

  trackGameStart(): void {
    this.log('game_start');
  }

  trackGuess(word: string, score: number, attemptNumber: number): void {
    this.log('guess', { word, score, attempt_number: attemptNumber });
  }

  trackWin(word: string, attempts: number, durationSeconds: number): void {
    this.log('win', { word, attempts, duration_seconds: durationSeconds });
  }
}
