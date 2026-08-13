import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseValueAccessor } from '../base/base-value-accessor';

export interface HierarchicalScopeValue {
    tenantId: number;
    businessId: number | null;
    branchId: number | null;
}

export interface ScopeLookupOption {
    id: number;
    label: string;
}

@Component({
    selector: 'app-hierarchical-scope-selector',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: HierarchicalScopeSelectorComponent, multi: true }],
    templateUrl: './hierarchical-scope-selector.component.html',
    styleUrl: './hierarchical-scope-selector.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchicalScopeSelectorComponent extends BaseValueAccessor<HierarchicalScopeValue> {
    readonly loadTenants = input.required<() => Observable<readonly ScopeLookupOption[]>>();
    readonly loadBusinesses = input.required<(tenantId: number) => Observable<readonly ScopeLookupOption[]>>();
    readonly loadBranches = input.required<(tenantId: number, businessId: number) => Observable<readonly ScopeLookupOption[]>>();
    readonly tenantLabel = input('Tenant');
    readonly businessLabel = input('Business');
    readonly branchLabel = input('Branch');

    readonly tenants = signal<readonly ScopeLookupOption[]>([]);
    readonly businesses = signal<readonly ScopeLookupOption[]>([]);
    readonly branches = signal<readonly ScopeLookupOption[]>([]);
    readonly loadingLevels = signal<ReadonlySet<'tenant' | 'business' | 'branch'>>(new Set());
    readonly loadError = signal<string | null>(null);

    private readonly destroyRef = inject(DestroyRef);
    private readonly requestVersion = { tenant: 0, business: 0, branch: 0 };

    constructor() {
        super();
        effect(() => {
            const loader = this.loadTenants();
            untracked(() => this.loadOptions('tenant', loader(), options => this.tenants.set(options)));
        });
    }

    override writeValue(value: HierarchicalScopeValue | null): void {
        const normalized = this.normalize(value);
        super.writeValue(normalized);
        if (normalized) this.loadChildren(normalized);
    }

    protected tenantChanged(event: Event): void {
        const tenantId = this.readId(event);
        this.businesses.set([]);
        this.branches.set([]);
        this.emitValue(tenantId === null ? null : { tenantId, businessId: null, branchId: null });
        if (tenantId !== null) {
            this.loadOptions('business', this.loadBusinesses()(tenantId), options => this.businesses.set(options));
        }
    }

    protected businessChanged(event: Event): void {
        const current = this.value();
        if (!current) return;
        const businessId = this.readId(event);
        this.branches.set([]);
        this.emitValue({ tenantId: current.tenantId, businessId, branchId: null });
        if (businessId !== null) {
            this.loadOptions('branch', this.loadBranches()(current.tenantId, businessId), options => this.branches.set(options));
        }
    }

    protected branchChanged(event: Event): void {
        const current = this.value();
        if (!current?.businessId) return;
        this.emitValue({ ...current, branchId: this.readId(event) });
    }

    protected isLoading(level: 'tenant' | 'business' | 'branch'): boolean {
        return this.loadingLevels().has(level);
    }

    private loadChildren(value: HierarchicalScopeValue): void {
        this.loadOptions('business', this.loadBusinesses()(value.tenantId), options => this.businesses.set(options));
        if (value.businessId !== null) {
            this.loadOptions('branch', this.loadBranches()(value.tenantId, value.businessId), options => this.branches.set(options));
        }
    }

    private loadOptions(
        level: 'tenant' | 'business' | 'branch',
        request: Observable<readonly ScopeLookupOption[]>,
        assign: (options: readonly ScopeLookupOption[]) => void,
    ): void {
        const version = ++this.requestVersion[level];
        this.loadingLevels.update(levels => new Set([...levels, level]));
        this.loadError.set(null);
        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: options => {
                if (version === this.requestVersion[level]) assign(options.filter(this.validOption));
            },
            error: () => {
                if (version === this.requestVersion[level]) {
                    assign([]);
                    this.loadError.set(`Unable to load ${level} options.`);
                    this.finishLoading(level);
                }
            },
            complete: () => {
                if (version === this.requestVersion[level]) this.finishLoading(level);
            }
        });
    }

    private normalize(value: HierarchicalScopeValue | null): HierarchicalScopeValue | null {
        if (!value || !Number.isSafeInteger(value.tenantId) || value.tenantId <= 0) return null;
        const businessId = value.businessId && value.businessId > 0 ? value.businessId : null;
        const branchId = businessId && value.branchId && value.branchId > 0 ? value.branchId : null;
        return { tenantId: value.tenantId, businessId, branchId };
    }

    private readId(event: Event): number | null {
        const raw = (event.target as HTMLSelectElement).value;
        if (!raw) return null;
        const value = Number(raw);
        return Number.isSafeInteger(value) && value > 0 ? value : null;
    }

    private readonly validOption = (option: ScopeLookupOption): boolean =>
        Number.isSafeInteger(option.id) && option.id > 0 && !!option.label?.trim();

    private finishLoading(level: 'tenant' | 'business' | 'branch'): void {
        this.loadingLevels.update(levels => {
            const next = new Set(levels);
            next.delete(level);
            return next;
        });
    }
}
