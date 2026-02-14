# @qarapace/ngfire

A minimal Angular wrapper around the Firebase JS SDK.

## Why

Inspired by [`@angular/fire`](https://github.com/angular/angularfire) and [`rxfire`](https://github.com/FirebaseExtended/rxfire), **ngfire** aims to provide a thinner integration layer suited for modern Angular (zoneless, signals).

> Stay minimal, stay current, stay out of the way.

## Philosophy

- **Don't re-wrap what works**: the Firebase JS SDK is well-designed, ngfire only adds value where Angular-specific bridging is needed
- **Thin layer**: the less code between your app and Firebase, the easier it is to stay up to date and debug
- **Tree-shakable**: single library covering App, Firestore, Auth, Functions, etc., import only what you use

## Features

### RxJS Observables

Firestore and Auth are inherently data flows — ngfire maps their listener-based APIs (`onSnapshot`, `onAuthStateChanged`, etc.) to RxJS Observables as the natural primitive.

For signals, Angular's built-in `rxResource` already bridges Observables seamlessly — no need for another wrapper.

### Dependency Injection

Provide Firebase services (App, Firestore, Auth, Functions, etc.) through Angular DI with proper dependency chains:

```
FirebaseApp → Firestore
            → Auth
            → Functions
            → ...
```

## Covered Firebase Products

- App (initialization and configuration)
- Analytics
- Firestore
- Auth
- Functions

## Installation

```bash
npm install @qarapace/ngfire
```

ngfire is a companion to the official `firebase` package — it does not bundle or replace it.

## Usage

### Configuration

```typescript
// app.config.ts
import { provideNgFire } from '@qarapace/ngfire/app';
import { withAuth } from '@qarapace/ngfire/auth';
import { withFirestore } from '@qarapace/ngfire/firestore';
import { withFunctions } from '@qarapace/ngfire/functions';

export const appConfig: ApplicationConfig = {
  providers: [
    // Features are registered in order, guaranteeing factory execution sequence
    // (e.g. Auth is initialized before Firestore)
    provideNgFire(
      { firebase: environment.firebase },
      withAuth(),
      withFirestore(),
      withFunctions({ region: 'europe-west1' })
    ),
  ],
};
```

### Auth service

```typescript
import { inject, Injectable } from '@angular/core';
import { User } from 'firebase/auth';
import { Observable, first } from 'rxjs';
import { AUTH, onAuthStateChanged$ } from '@qarapace/ngfire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(AUTH);

  // Already shared (shareReplay) — all ngfire observables are
  readonly user$: Observable<User | null> = onAuthStateChanged$(this.auth);

  // Resolves once the auth state is known (useful for guards, resolvers, etc.)
  readonly onReady$ = this.user$.pipe(first());

  // Bridge to signals via Angular's built-in rxResource
  readonly user = rxResource({ stream: () => this.user$ });
}
```

### Firestore service

```typescript
import { inject, Injectable } from '@angular/core';
import { collection, doc, query, where } from 'firebase/firestore';
import { map } from 'rxjs';
import { FIRESTORE, onSnapshot$ } from '@qarapace/ngfire/firestore';

// Use the Firebase SDK directly — ngfire only provides essential helpers
// like onSnapshot$(), without unnecessary abstractions on top
@Injectable({ providedIn: 'root' })
export class DataService {
  private firestore = inject(FIRESTORE);

  getDocument(id: string) {
    return onSnapshot$(doc(this.firestore, 'items', id)).pipe(
      map((snap) => snap.data()),
    );
  }

  getActiveItems() {
    const q = query(
      collection(this.firestore, 'items'),
      where('active', '==', true),
    );
    return onSnapshot$(q).pipe(
      map((snap) => snap.docs.map((d) => d.data())),
    );
  }
}
```

### Functions service

```typescript
import { inject, Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import { FUNCTIONS } from '@qarapace/ngfire/functions';

@Injectable({ providedIn: 'root' })
export class FunctionsService {
  private functions = inject(FUNCTIONS);

  async sendEmail(to: string, subject: string) {
    const callable = httpsCallable(this.functions, 'sendEmail');
    return callable({ to, subject });
  }
}
```

### Emulators

ngfire supports Firebase emulators out of the box. See [Emulator Connection](ARCHITECTURE.md#emulator-connection) in the architecture doc for setup options, including a tree-shakable approach that keeps emulator code out of production builds.
