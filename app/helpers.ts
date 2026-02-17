import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

/**
 * Creates an observable from a Firebase onSnapshot-style listener.
 *
 * Each subscriber gets its own independent Firebase listener.
 * Use `sharedFirebaseListener` if you need multiple subscribers
 * sharing a single listener.
 *
 * @param subscribe - A function matching the Firebase listener pattern:
 *   takes a `next` callback and an `error` callback, returns an unsubscribe function.
 *
 * @example
 * ```typescript
 * const user$ = fromFirebaseListener<User | null>(
 *   (next, error) => onIdTokenChanged(auth, next, error)
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
  });
}

/**
 * Creates a **shared** observable from a Firebase onSnapshot-style listener.
 *
 * Uses `shareReplay({ bufferSize: 1, refCount: true })`:
 * - All subscribers share a single underlying Firebase listener.
 * - Late subscribers immediately receive the last emitted value.
 * - The listener is torn down when the last subscriber unsubscribes,
 *   and re-created if a new subscriber arrives after that.
 *
 * This is the right choice when one listener feeds many consumers.
 * Use `fromFirebaseListener` when you need a single independent listener
 * (e.g. feeding an `rxResource`).
 *
 * @param subscribe - A function matching the Firebase listener pattern:
 *   takes a `next` callback and an `error` callback, returns an unsubscribe function.
 *
 * @example
 * ```typescript
 * const doc$ = sharedFirebaseListener<DocumentSnapshot>(
 *   (next, error) => onSnapshot(docRef, next, error)
 * );
 * ```
 */
export function sharedFirebaseListener<T>(
  subscribe: (
    next: (value: T) => void,
    error: (err: Error) => void
  ) => () => void
): Observable<T> {
  return fromFirebaseListener(subscribe).pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
