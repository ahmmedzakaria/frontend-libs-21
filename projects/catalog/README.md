# @nexacore/catalog

Framework-light public catalog contracts shared by the future catalog frontend
and its tests. The package contains:

- tenant-safe public view models;
- stable public route definitions;
- representative English and Bengali fixture content;
- a replaceable fixture content source;
- catalog-specific CSS design tokens.

It does not define API URLs, backend entities, feature pages, credentials, or
administrative authorization.

Build and test:

```bash
npx ng build catalog
npx ng test catalog --watch=false
```
