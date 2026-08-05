import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Structural directive for action-level privilege gating —
 * `*appHasPrivilege="'PERSON_CREATE'"` (or an array for "any of"). Built now,
 * not yet applied to any real template: we don't have a confirmed privilege-
 * code catalog to wire specific codes against (see the follow-up in the plan).
 */
@Directive({
    selector: '[appHasPrivilege]',
    standalone: true
})
export class HasPrivilegeDirective {
    private readonly authService = inject(AuthService);
    private readonly templateRef = inject(TemplateRef<unknown>);
    private readonly viewContainer = inject(ViewContainerRef);
    private hasView = false;

    readonly appHasPrivilege = input<string | string[]>([]);

    constructor() {
        effect(() => {
            const raw = this.appHasPrivilege();
            const codes = Array.isArray(raw) ? raw : [raw];
            const allowed = !codes.length || codes.some((code) => this.authService.hasPrivilege(code));

            if (allowed && !this.hasView) {
                this.viewContainer.createEmbeddedView(this.templateRef);
                this.hasView = true;
            } else if (!allowed && this.hasView) {
                this.viewContainer.clear();
                this.hasView = false;
            }
        });
    }
}
