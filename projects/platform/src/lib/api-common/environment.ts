import { InjectionToken } from '@angular/core';

export interface NexacoreEnvironment {
  production: boolean;
  backendOrigin: string;
  loginUrl: string;
  apiBaseUrl: string;
  clientCode: string;
  apiKey: string;
}

export const Environment: NexacoreEnvironment = {
  production: false,
  backendOrigin: 'http://localhost:9100',
  // Every backend route lives under /api/v1 (Spring's @RequestMapping on
  // each controller, no global context-path) — including auth, which is
  // /api/v1/auth, not a separate unversioned prefix.
  loginUrl: '/api/v1/auth',
  apiBaseUrl: '/api/v1',
  clientCode: 'WEB',
  apiKey: '',
};

/**
 * Overridable via DI — Environment now lives inside this pre-built package, so
 * Angular's fileReplacements (which only rewrites the *consuming* app's own
 * source files at its build time) can no longer reach it. Consuming apps that
 * need a different `backendOrigin`/`apiBaseUrl` per environment should
 * `provide(API_ENVIRONMENT, { useValue: ... })` in their own bootstrap,
 * sourced from their own fileReplacements-driven environment file.
 */
export const API_ENVIRONMENT = new InjectionToken<NexacoreEnvironment>('API_ENVIRONMENT', {
  factory: () => Environment,
});
