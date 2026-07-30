# Changelog

All notable changes to `@nexacore/layout` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

### Fixed

- `sidebar.component.ts` and `topbar.component.ts` imported
  `@nexacore/shared/i18n/translate.pipe` and
  `@nexacore/shared/i18n/i18n.service` directly — deep paths into `shared`'s
  internal file structure that only worked via a wildcard path alias. Fixed
  to import `TranslatePipe`/`I18nService`/`SupportedLocale` through
  `@nexacore/shared`'s public API instead.
- `@nexacore/api-common` and `@nexacore/shared` were declared as plain
  `dependencies` in this package's `package.json`, which `ng-packagr` rejects
  by default for internal library-to-library deps (correctly — both provide
  `providedIn: 'root'` singleton services, and a plain dependency risks two
  separate instances ending up in a consuming app). Moved to
  `peerDependencies`, alongside `@angular/*`, `@jsverse/transloco`, and
  `rxjs`.

### Known issue

- `theme.service.spec.ts` has 3 failing tests (asserts on `document.body`/
  `localStorage` immediately after `ThemeService.select()`, before the
  service's `effect()` has actually flushed). This is pre-existing — these
  tests were never runnable in isolation before this package had its own
  `ng test` target, so this is the first time anyone has seen them fail.
  Tracked separately.
