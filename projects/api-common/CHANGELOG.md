# Changelog

All notable changes to `@nexacore/api-common` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

### Changed

- `ApiService.buildHeaders()` no longer attaches the `Authorization` header
  itself — `jwtInterceptor` is now the single place that reads the stored
  token and sets it, removing a redundant duplicate write.
- `Environment` is now exposed through the `API_ENVIRONMENT` injection token
  instead of being a hardcoded module-level constant. Consuming apps can
  override `backendOrigin`/`apiBaseUrl`/etc. per build by providing
  `{ provide: API_ENVIRONMENT, useValue: ... }` in their own bootstrap,
  sourced from their own environment files — this became necessary once
  `Environment` started living inside a pre-built package, which Angular's
  `fileReplacements` mechanism cannot reach into.
- `ApiEndpoint.service` removed — it was never read by
  `ApiService.resolveBasePath()` or anywhere else.

### Added

- First test coverage for this package: `api.service.spec.ts` verifies both
  the `API_ENVIRONMENT` default-factory fallback and an app-provided override.
