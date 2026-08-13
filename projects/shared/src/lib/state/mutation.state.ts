import { computed, signal } from '@angular/core';

export type MutationStatus = 'idle' | 'pending' | 'succeeded' | 'failed' | 'revoked';

export class MutationState {
    readonly status = signal<MutationStatus>('idle');
    readonly error = signal<string | null>(null);
    readonly code = signal<string | null>(null);
    readonly traceId = signal<string | null>(null);
    readonly pending = computed(() => this.status() === 'pending');

    begin(): boolean {
        if (this.pending() || this.status() === 'revoked') return false;
        this.error.set(null); this.code.set(null); this.traceId.set(null); this.status.set('pending'); return true;
    }
    succeed(): void { if (this.pending()) this.status.set('succeeded'); }
    fail(message: string): void { if (this.pending()) { this.error.set(message); this.status.set('failed'); } }
    failStructured(message: string, code?: string, traceId?: string): void {
        if (this.pending()) { this.error.set(message); this.code.set(code ?? null); this.traceId.set(traceId ?? null); this.status.set('failed'); }
    }
    revoke(): void { this.error.set(null); this.status.set('revoked'); }
    reset(): void { this.error.set(null); this.code.set(null); this.traceId.set(null); this.status.set('idle'); }
}
