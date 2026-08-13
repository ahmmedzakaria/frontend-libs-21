import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthorizationPolicyService } from './authorization-policy.service';

@Directive({
    selector: '[appAuthorizedUi]',
    standalone: true
})
export class AuthorizedUiDirective {
    private readonly template = inject(TemplateRef<unknown>);
    private readonly container = inject(ViewContainerRef);
    private readonly policy = inject(AuthorizationPolicyService);
    private rendered = false;

    readonly actionCode = input('', { alias: 'appAuthorizedUi' });

    constructor() {
        effect(() => {
            const allowed = this.policy.isActionAllowed(this.actionCode());
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
