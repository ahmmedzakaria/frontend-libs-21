# Changelog

All notable changes to `@nexacore/platform` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-08-05

Split `lib/shared/` back out into its own `@nexacore/shared` package — see
`../shared/CHANGELOG.md` for why. `@nexacore/platform` now contains
`lib/api-common`, `lib/layout`, and `lib/auth` only. No public API changes to
the symbols that remain here; `IconComponent`/the icon registry stay in
`lib/layout` and are now consumed by `@nexacore/shared` as a `peerDependency`
back onto this package.

## [0.1.0] - 2026-08-05

Merged the four previously-separate packages — `@nexacore/api-common`,
`@nexacore/shared`, `@nexacore/layout`, `@nexacore/auth` — into this single
`@nexacore/platform` package (`lib/api-common`, `lib/shared`, `lib/layout`,
`lib/auth`). Their dependency graph was already fully linear
(`api-common ← layout ← shared`, and `api-common` + `layout` ← `auth`), so
there was no circularity to resolve; in practice all four were always
installed and rebuilt together by the one consuming app, so separate
packages were paying an ongoing rebuild/versioning cost (remembering which of
4 packages to rebuild after an edit, 4 sets of peer-dependency bookkeeping)
without the "install only what you need" benefit ever paying off. One
package now means one `ng build`, one version, and the internal
`@nexacore/layout`/`@nexacore/api-common` `peerDependencies` documented below
(added specifically to avoid duplicate-singleton risk across package
boundaries) are no longer needed at all — everything is a plain relative
import within one package now.

No public API changes — every symbol previously exported by the four
packages is re-exported unchanged from `@nexacore/platform`.

---

Below is the preserved history from each of the four original packages,
covering their initial extraction from raw source into independent
`ng-packagr` libraries (2026-07-30), before this merge.

## `api-common` history

### [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

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
- First test coverage for this package: `api.service.spec.ts` verifies both
  the `API_ENVIRONMENT` default-factory fallback and an app-provided override.

## `layout` history

### [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

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
  `rxjs`. (Resolved by this package's merge into `@nexacore/platform` — see
  the `[0.1.0] - 2026-08-05` entry above.)
- Known issue at the time: `theme.service.spec.ts` had 3 failing tests
  (asserts on `document.body`/`localStorage` immediately after
  `ThemeService.select()`, before the service's `effect()` had actually
  flushed) — pre-existing, still open as of the merge.

## `auth` history

### [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

- `@nexacore/api-common` and `@nexacore/layout` (this package depends on
  `layout`'s `SidebarMenuService` from `auth.service.ts`) are declared as
  `peerDependencies`, not plain `dependencies` — both are `providedIn: 'root'`
  singletons, and `ng-packagr` correctly refuses to let an internal library
  dependency risk a duplicate instance. (Resolved by this package's merge
  into `@nexacore/platform` — see the `[0.1.0] - 2026-08-05` entry above.)
- `jwt-decode` is a plain `dependency` (explicitly allow-listed via
  `allowedNonPeerDependencies` in `ng-package.json`) — it's a stateless
  utility, not a singleton service, so a peer dependency isn't the right fit.
- `ApiEndpoint.service` removed from every endpoint literal in
  `auth.service.ts` (`AUTHENTICATE_ENDPOINT` and friends) — the field was
  removed from the `ApiEndpoint` interface itself in `api-common` because
  nothing ever read it.
