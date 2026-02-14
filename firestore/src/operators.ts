import { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { OperatorFunction, pipe } from 'rxjs';
import { map, scan } from 'rxjs/operators';

/**
 * RxJS operator that efficiently maps Firestore `QuerySnapshot` emissions
 * by only recomputing changed documents.
 *
 * Uses `docChanges()` to detect additions, modifications, and removals,
 * preserving object references for unchanged documents. This avoids
 * unnecessary converter calls and prevents Angular signal/change-detection
 * churn.
 *
 * @param mapper - Transform a `QueryDocumentSnapshot` into `T` (called only for new/modified docs).
 *                 Defaults to `doc.data()` when omitted.
 *
 * @example
 * ```typescript
 * onSnapshot$(query).pipe(
 *   snapshotChanges(doc => ({ ...doc.data(), id: doc.id }))
 * );
 * ```
 */
export function snapshotChanges<AppType, DbType extends object>(
  mapper?: (doc: QueryDocumentSnapshot<AppType, DbType>) => AppType
): OperatorFunction<QuerySnapshot<AppType, DbType>, AppType[]>;

export function snapshotChanges<AppType, DbType extends object, T>(
  mapper: (doc: QueryDocumentSnapshot<AppType, DbType>) => T
): OperatorFunction<QuerySnapshot<AppType, DbType>, T[]>;

export function snapshotChanges<AppType, DbType extends object, T = AppType>(
  mapper?: (doc: QueryDocumentSnapshot<AppType, DbType>) => T
): OperatorFunction<QuerySnapshot<AppType, DbType>, T[]> {
  const mapFn =
    mapper ??
    ((doc: QueryDocumentSnapshot<AppType, DbType>) =>
      doc.data() as unknown as T);
  return pipe(
    scan(
      ({ cache, list }, snapshot: QuerySnapshot<AppType, DbType>) => {
        const changes = snapshot.docChanges();
        if (changes.length === 0) return { cache, list };

        const nextCache = new Map(cache);
        for (const change of changes) {
          if (change.type === 'removed') {
            nextCache.delete(change.doc.id);
          } else {
            nextCache.set(change.doc.id, mapFn(change.doc));
          }
        }

        const nextList = snapshot.docs.map((doc) => nextCache.get(doc.id) as T);
        return { cache: nextCache, list: nextList };
      },
      { cache: new Map<string, T>(), list: [] as T[] }
    ),
    map(({ list }) => list)
  );
}
