import { EffectRef, Injectable, Injector, Signal, effect, runInInjectionContext } from '@angular/core';

export interface RevocationRegistration {
    destroy(): void;
}

/** Closes unsafe page state when a previously granted live decision is revoked. */
@Injectable({ providedIn: 'root' })
export class AuthorizationRevocationService {
    constructor(private readonly injector: Injector) {}

    watch(allowed: Signal<boolean>, close: () => void): RevocationRegistration {
        let wasAllowed = allowed();
        const reference: EffectRef = runInInjectionContext(this.injector, () => effect(() => {
            const isAllowed = allowed();
            if (wasAllowed && !isAllowed) close();
            wasAllowed = isAllowed;
        }));
        return { destroy: () => reference.destroy() };
    }
}
