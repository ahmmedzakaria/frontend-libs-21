import { Signal, computed } from '@angular/core';
import { AuthorizationPolicyService } from './authorization-policy.service';

export interface AuthorizationDecision {
    allowed: boolean;
    kind: 'privilege' | 'route' | 'action';
    target: string;
}

/** Reactive, fail-closed decisions that update whenever application context changes. */
export class AuthorizationDecisionFactory {
    constructor(private readonly policies: AuthorizationPolicyService) {}

    privilege(code: string): Signal<AuthorizationDecision> {
        return computed(() => ({ allowed: this.policies.hasPrivilege(code), kind: 'privilege', target: code }));
    }

    route(url: string): Signal<AuthorizationDecision> {
        return computed(() => ({ allowed: this.policies.isRouteAllowed(url), kind: 'route', target: url }));
    }

    action(code: string): Signal<AuthorizationDecision> {
        return computed(() => ({ allowed: this.policies.isActionAllowed(code), kind: 'action', target: code }));
    }
}
