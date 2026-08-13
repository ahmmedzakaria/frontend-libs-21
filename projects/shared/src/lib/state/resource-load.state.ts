import { computed, signal } from '@angular/core';

export type ResourceLoadStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'denied' | 'failed';

export class ResourceLoadState<T> {
    readonly status = signal<ResourceLoadStatus>('idle');
    readonly value = signal<T | null>(null);
    readonly error = signal<string | null>(null);
    readonly traceId = signal<string | null>(null);
    readonly canMutate = computed(() => this.status() === 'loaded');

    begin(): void { this.status.set('loading'); this.value.set(null); this.error.set(null); this.traceId.set(null); }
    succeed(value: T, empty = false): void {
        this.value.set(value); this.error.set(null); this.traceId.set(null);
        this.status.set(empty ? 'empty' : 'loaded');
    }
    deny(message: string, traceId?: string): void {
        this.value.set(null); this.error.set(message); this.traceId.set(traceId ?? null); this.status.set('denied');
    }
    fail(message: string, traceId?: string): void {
        this.value.set(null); this.error.set(message); this.traceId.set(traceId ?? null); this.status.set('failed');
    }
    reset(): void { this.status.set('idle'); this.value.set(null); this.error.set(null); this.traceId.set(null); }
}
