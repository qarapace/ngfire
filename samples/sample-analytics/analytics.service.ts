import { inject, Injectable } from '@angular/core';
import { ANALYTICS } from '@qarapace/ngfire/analytics';
import { EventParams, logEvent } from 'firebase/analytics';

/**
 * Sample service demonstrating `@qarapace/ngfire/analytics` usage.
 *
 * The `ANALYTICS` token is provided by `withAnalytics()` during app bootstrap.
 * It is injected as `optional` so the service degrades gracefully when analytics
 * is not configured (e.g. in tests or environments where analytics is unsupported).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private analytics = inject(ANALYTICS, { optional: true });

  private log(event: string, params?: EventParams): void {
    if (!this.analytics) return;
    logEvent(this.analytics, event, params);
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
