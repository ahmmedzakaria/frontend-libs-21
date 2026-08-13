import { computed, signal } from '@angular/core';

export type MutationStatus = 'idle' | 'pending' | 'succeeded' | 'failed' | 'revoked';

export class MutationState {
    readonly status = signal<MutationStatus>('idle');
    readonly error = signal<string | null>(null);
    readonly pending = computed(() => this.status() === 'pending');

    begin(): boolean {
        if (this.pending() || this.status() === 'revoked') return false;
        this.error.set(null); this.status.set('pending'); return true;
    }
    succeed(): void { if (this.pending()) this.status.set('succeeded'); }
    fail(message: string): void { if (this.pending()) { this.error.set(message); this.status.set('failed'); } }
    revoke(): void { this.error.set(null); this.status.set('revoked'); }
    reset(): void { this.error.set(null); this.status.set('idle'); }
}
