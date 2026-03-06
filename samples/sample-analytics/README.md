# sample-analytics

Custom event tracking using `@qarapace/ngfire/analytics` with Firebase Analytics.

## Architecture

The service wraps Firebase Analytics behind a thin Angular service that injects the `ANALYTICS` token provided by `withAnalytics()`.

### Key concepts

1. **`ANALYTICS` injection token** -- provided by calling `withAnalytics()` in your app's `provideNgFire()` setup. The token resolves to the Firebase `Analytics` instance.

2. **Optional injection** -- `inject(ANALYTICS, { optional: true })` lets the service degrade gracefully when analytics is not configured (e.g. in unit tests or SSR).

3. **`logEvent`** -- the standard Firebase Analytics function used to record custom events. Each method maps to a domain-specific event (`game_start`, `guess`, `win`).

### Setup

```typescript
provideNgFire(firebaseConfig, withAnalytics())
```

### Events

| Method           | Event name   | Parameters                              |
| ---------------- | ------------ | --------------------------------------- |
| `trackGameStart` | `game_start` | --                                      |
| `trackGuess`     | `guess`      | `word`, `score`, `attempt_number`       |
| `trackWin`       | `win`        | `word`, `attempts`, `duration_seconds`  |
