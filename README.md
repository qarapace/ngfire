# @fo/ngfire

A minimal Angular wrapper around the Firebase JS SDK.

## Why

`@angular/fire` and `rxfire` add abstraction layers over the Firebase JS SDK that bring more confusion than value, especially in the modern Angular world:

- **Lagging behind**: both libraries are consistently out of date with the official Firebase SDK releases
- **Unnecessary in zoneless Angular**: their main value was bridging Firebase callbacks with Zone.js change detection — this is no longer needed
- **Opaque abstractions**: they re-wrap Firebase APIs without adding meaningful functionality, making debugging harder

**ngfire** takes a different approach: stay minimal, stay current, stay out of the way.

## Philosophy

- **Don't re-wrap what works**: the Firebase JS SDK is well-designed — ngfire only adds value where Angular-specific bridging is needed
- **Thin layer**: the less code between your app and Firebase, the easier it is to stay up to date and debug
- **Tree-shakable**: single library covering App, Firestore, Auth, Functions, etc. — import only what you use

## Features

### RxJS Helpers

Map Firebase listener-based APIs (`onSnapshot`, `onAuthStateChanged`, etc.) to RxJS Observables.

### Angular Signal Helpers

Expose Firebase state as Angular Signals for use in modern reactive templates.

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
npm install firebase
```

ngfire is a companion to the official `firebase` package — it does not bundle or replace it.
