import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { MutationExecutionGate } from './mutation-execution';

describe('MutationExecutionGate', () => {
    it('does not replay a failed mutation and rejects duplicate execution', () => {
        const request = new Subject<void>();
        const factory = vi.fn(() => request.asObservable());
        const gate = new MutationExecutionGate();
        gate.execute(factory)?.subscribe({ error: () => undefined });
        expect(gate.execute(factory)).toBeNull();
        request.error(new Error('denied'));
        expect(factory).toHaveBeenCalledTimes(1);
        expect(gate.pending).toBe(false);
    });
});
