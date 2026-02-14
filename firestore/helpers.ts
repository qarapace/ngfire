import {
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  onSnapshot,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { fromFirebaseListener } from '../app/helpers';

/**
 * Observable wrapper around Firestore's `onSnapshot`.
 *
 * Works with both `DocumentReference` and `Query` (including `CollectionReference`),
 * mirroring the SDK's `onSnapshot` overloads.
 *
 * **Opinionated**: the returned observable is shared (see `fromFirebaseListener`).
 *
 * @example
 * ```typescript
 * // Document
 * onSnapshot$(docRef).pipe(map(snap => snap.data()));
 *
 * // Collection / Query
 * onSnapshot$(query(collectionRef, where('active', '==', true)))
 *   .pipe(map(snap => snap.docs.map(d => d.data())));
 * ```
 */
export function onSnapshot$<AppType, DbType extends object>(
  ref: DocumentReference<AppType, DbType>
): Observable<DocumentSnapshot<AppType, DbType>>;

export function onSnapshot$<AppType, DbType extends object>(
  ref: Query<AppType, DbType>
): Observable<QuerySnapshot<AppType, DbType>>;

export function onSnapshot$<AppType, DbType extends object>(
  ref: DocumentReference<AppType, DbType> | Query<AppType, DbType>
): Observable<
  DocumentSnapshot<AppType, DbType> | QuerySnapshot<AppType, DbType>
> {
  return fromFirebaseListener((next, error) =>
    onSnapshot(ref as any, next as any, error)
  );
}
