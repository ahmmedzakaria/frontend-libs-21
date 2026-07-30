# Changelog

All notable changes to `@nexacore/shared` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

### Changed

- **Breaking**: `KycFormComponent` no longer injects `kyc-frontend-21`'s own
  `KycService` and no longer calls any backend endpoint itself — it was a
  hard dependency on an app-specific service that made this component
  impossible to package standalone. It now builds the `FormData` payload and
  emits it via a new `formSubmitted` output; the consuming app owns the
  actual create/update call and its own success handling. The old `saved`
  output is gone.
- `KycTableComponent` and `KycFormComponent` now import their `Kyc` type from
  this package's own `models/kyc.model.ts` instead of reaching into
  `kyc-frontend-21`'s `@app-core/services/kyc.service` — a shared library
  must not depend on a specific consuming app's internals.
- Consumers that reached past this package's public API into internal file
  paths (e.g. `@nexacore/shared/i18n/translate.pipe`) will need to import
  from `@nexacore/shared` directly instead — that only ever worked via a
  wildcard path alias that a real published package doesn't expose. (`layout`
  and `kyc-frontend-21` both had one or two of these; already fixed there.)

### Added

- `Kyc` model, exported from the public API — the single source of truth
  `kyc-frontend-21`'s own `core/services/kyc.service.ts` now re-exports
  rather than duplicating.
