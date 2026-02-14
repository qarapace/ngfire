import { Observable, defer } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

/**
 * Creates an observable from a Firebase onSnapshot-style listener.
 *
 * **Opinionated**: the returned observable is **shared** (`shareReplay` with
 * `bufferSize: 1` and `refCount: true`). This means:
 *
 * - All subscribers share a single underlying Firebase listener.
 * - Late subscribers immediately receive the last emitted value.
 * - The Firebase listener is torn down when the last subscriber unsubscribes,
 *   and re-created if a new subscriber arrives after that.
 *
 * This matches the most common Firebase usage pattern: one listener feeding
 * many consumers. If you need independent listeners per subscriber, wrap your
 * own `new Observable(...)` instead.
 *
 * @param subscribe - A function matching the Firebase listener pattern:
 *   takes a `next` callback and an `error` callback, returns an unsubscribe function.
 *
 * @example
 * ```typescript
 * const doc$ = fromFirebaseListener<DocumentSnapshot>(
 *   (next, error) => onSnapshot(docRef, next, error)
 * );
 * ```
 */
export function fromFirebaseListener<T>(
  subscribe: (
    next: (value: T) => void,
    error: (err: Error) => void
  ) => () => void
): Observable<T> {
  return new Observable<T>((subscriber) => {
    const unsubscribe = subscribe(
      (value) => subscriber.next(value),
      (err) => subscriber.error(err)
    );
    return () => unsubscribe();
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
}

/**
 * Creates an observable from a Firebase promise-based operation.
 *
 * The promise is **lazily** evaluated: it is only created when the observable
 * is subscribed to. This is a thin wrapper around RxJS `defer` that accepts
 * promises natively.
 *
 * @param promiseFn - A factory function returning a Firebase promise.
 *
 * @example
 * ```typescript
 * const user$ = fromFirebasePromise(() => getUser(auth));
 * ```
 */
export function fromFirebasePromise<T>(
  promiseFn: () => Promise<T>
): Observable<T> {
  return defer(promiseFn);
}
