import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { AuthorizationPolicyService } from './authorization-policy.service';

describe('AuthorizationPolicyService reactive decisions', () => {
    it('updates a computed privilege decision after context revocation', () => {
        const privileges = signal(['11020100787']);
        const context = {
            hasPrivilege: (code: string) => privileges().includes(code),
            routePolicies: signal([]),
            uiPolicies: signal([]),
        };
        const service = new AuthorizationPolicyService(context as never);
        const allowed = service.privilegeAllowed('11020100787');
        expect(allowed()).toBe(true);
        privileges.set([]);
        expect(allowed()).toBe(false);
    });
});
