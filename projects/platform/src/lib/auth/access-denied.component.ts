import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-access-denied',
    standalone: true,
    imports: [RouterLink],
    template: `
        <main class="access-denied" role="main">
            <h1>Access denied</h1>
            <p>Your current application privileges do not allow this page.</p>
            <a routerLink="/dashboard">Return to dashboard</a>
        </main>
    `,
    styles: [`
        .access-denied { max-width: 40rem; margin: 10vh auto; padding: var(--space-6, 2rem); text-align: center; }
        a { color: var(--color-primary, currentColor); }
    `]
})
export class AccessDeniedComponent {}
