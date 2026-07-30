# Changelog

All notable changes to `@nexacore/auth` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

### Changed

- `@nexacore/api-common` and `@nexacore/layout` (this package depends on
  `layout`'s `SidebarMenuService` from `auth.service.ts`) are declared as
  `peerDependencies`, not plain `dependencies` — both are `providedIn: 'root'`
  singletons, and `ng-packagr` correctly refuses to let an internal library
  dependency risk a duplicate instance.
- `jwt-decode` is a plain `dependency` (explicitly allow-listed via
  `allowedNonPeerDependencies` in `ng-package.json`) — it's a stateless
  utility, not a singleton service, so a peer dependency isn't the right fit.
- `ApiEndpoint.service` removed from every endpoint literal in
  `auth.service.ts` (`AUTHENTICATE_ENDPOINT` and friends) — the field was
  removed from the `ApiEndpoint` interface itself in `api-common` because
  nothing ever read it.
