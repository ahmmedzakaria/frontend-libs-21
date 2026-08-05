# Changelog

All notable changes to `@nexacore/shared` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-08-05

Split back out of `@nexacore/platform` into its own installable package.
`@nexacore/platform`'s 2026-08-05 merge folded four packages (`api-common`,
`shared`, `layout`, `auth`) into one, which measurably regressed
`kyc-frontend-21`'s eagerly-loaded initial bundle: `main.ts`/`app.routes.ts`
eagerly import a handful of `api-common`/`auth`/`layout` symbols (interceptors,
`authGuard`, `AUTH_ROUTES`, `AuthService`, `LayoutService`), and because those
lived in the same single FESM file as every Tier 1-6 shared component
(`DataTableComponent`, `WizardComponent`, `DatePickerComponent`, etc.), the
whole shared component library was getting pulled into the eager bundle too —
confirmed by inspecting the built chunk, which contained `app-data-table`,
`app-wizard`, `app-stepper`, and other shared selectors despite none of them
being referenced by any eagerly-loaded code path. None of `shared`'s content
is needed by `platform`'s eager entry points, so splitting it back into its
own package restores the free, file-level code-splitting boundary that a
single merged FESM file can't give you through tree-shaking alone.

`shared` now depends on `@nexacore/platform` (`peerDependency`) for
`IconComponent`/the icon registry — the one real cross-concern dependency,
confirmed one-directional (nothing in `platform` imports from `shared`).

No public API changes — every symbol previously exported by `@nexacore/platform`
that originated from its `lib/shared/` concern is now exported unchanged from
`@nexacore/shared` instead.

---

Below is the preserved history from when this code first shipped as its own
package (2026-07-30), before the brief 2026-08-05 merge into `@nexacore/platform`.

## [0.1.0] - 2026-07-30

Initial extraction into a real `ng-packagr` Angular library — previously this
was raw TypeScript source consumed by `kyc-frontend-21` via a path alias
directly into `src/lib/*`, with no independent build, version, or tests.

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
  wildcard path alias that a real published package doesn't expose.
- `Kyc` model, exported from the public API — the single source of truth
  `kyc-frontend-21`'s own `core/services/kyc.service.ts` now re-exports
  rather than duplicating.
