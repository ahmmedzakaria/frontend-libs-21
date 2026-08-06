import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { ApplicationContextService } from '../layout/index';
import { AuthService } from './auth.service';
import { isPolicyAllowed } from './policy-evaluator';

@Directive({
    selector: '[appAuthorizedUi]',
    standalone: true
})
export class AuthorizedUiDirective {
    private readonly template = inject(TemplateRef<unknown>);
    private readonly container = inject(ViewContainerRef);
    private readonly context = inject(ApplicationContextService);
    private readonly auth = inject(AuthService);
    private rendered = false;

    readonly actionCode = input('', { alias: 'appAuthorizedUi' });

    constructor() {
        effect(() => {
            const actionCode = this.actionCode().trim().toLowerCase();
            const policy = this.context.uiPolicies().find(candidate => candidate.actionCode === actionCode);
            const allowed = !!policy && isPolicyAllowed(
                policy.matchMode,
                policy.privilegeCodes,
                code => this.auth.hasPrivilege(code)
            );
            if (allowed && !this.rendered) {
                this.container.createEmbeddedView(this.template);
                this.rendered = true;
            } else if (!allowed && this.rendered) {
                this.container.clear();
                this.rendered = false;
            }
        });
    }
}
