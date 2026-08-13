import { describe, expect, it } from 'vitest';
import { MutationState } from './mutation.state';
import { ResourceLoadState } from './resource-load.state';

describe('administration safety state', () => {
    it('does not permit mutation after a denied or failed read', () => {
        const state = new ResourceLoadState<number[]>();
        state.begin();
        state.fail('unavailable');
        expect(state.value()).toBeNull();
        expect(state.canMutate()).toBe(false);
        state.deny('forbidden', 'trace-1');
        expect(state.canMutate()).toBe(false);
        expect(state.traceId()).toBe('trace-1');
    });

    it('prevents duplicate submits and closes mutation state on revocation', () => {
        const state = new MutationState();
        expect(state.begin()).toBe(true);
        expect(state.begin()).toBe(false);
        state.revoke();
        expect(state.pending()).toBe(false);
        expect(state.begin()).toBe(false);
    });
});
