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
