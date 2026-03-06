# sample-analytics

Custom event tracking using `@qarapace/ngfire/analytics` with Firebase Analytics.

Two variants are provided:

- **`analytics.service.ts`** -- uses the synchronous `ANALYTICS` token with optional injection.
- **`analytics-supported.service.ts`** -- uses the `ANALYTICS_SUPPORTED` token, a `Promise<Analytics | null>` that checks `isSupported()` without blocking app startup.

## Setup

```typescript
provideNgFire(firebaseConfig, withAnalytics())
```

## Variant 1: `ANALYTICS` (synchronous)

Injects the `ANALYTICS` token as `optional`. The service silently no-ops when analytics is not configured (e.g. in unit tests or SSR).

```typescript
private analytics = inject(ANALYTICS, { optional: true });
```

## Variant 2: `ANALYTICS_SUPPORTED` (async)

Injects a `Promise<Analytics | null>` that resolves once Firebase's `isSupported()` completes. This is the recommended approach when you want to respect browser support without blocking app startup.

```typescript
private analyticsPromise = inject(ANALYTICS_SUPPORTED);
```

The private `log` method awaits the promise, so public methods remain fire-and-forget.

## Events

| Method           | Event name   | Parameters                              |
| ---------------- | ------------ | --------------------------------------- |
| `trackGameStart` | `game_start` | --                                      |
| `trackGuess`     | `guess`      | `word`, `score`, `attempt_number`       |
| `trackWin`       | `win`        | `word`, `attempts`, `duration_seconds`  |
