import { Observable, defer, finalize } from 'rxjs';

/**
 * Executes one mutation at a time. It deliberately adds no retry or replay
 * operator: callers must require a fresh user gesture after every failure.
 */
export class MutationExecutionGate {
    private active = false;

    get pending(): boolean { return this.active; }

    execute<T>(request: () => Observable<T>): Observable<T> | null {
        if (this.active) return null;
        this.active = true;
        return defer(request).pipe(finalize(() => this.active = false));
    }
}
