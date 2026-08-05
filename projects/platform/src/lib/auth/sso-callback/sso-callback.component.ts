import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LayoutService, IconComponent } from '../../layout/index';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
    selector: 'app-sso-callback',
    standalone: true,
    imports: [NgIf, IconComponent, TranslocoPipe],
    template: `
        <div class="sso-page">
            <div class="sso-card">
                <div class="brand">
                    <app-icon name="user-shield" [size]="26" />
                    <div class="brand-text">
                        {{ 'brand.name' | transloco }}
                        <small>{{ 'brand.tagline' | transloco }}</small>
                    </div>
                </div>
                <h2 class="sso-title">Signing in</h2>
                <p class="sso-subtitle" *ngIf="!errorMessage">Completing SSO login...</p>
                <div *ngIf="errorMessage" class="alert alert-danger">
                    {{ errorMessage }}
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
        .sso-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            background: var(--paper);
            padding: var(--layout-space-4);
        }
        .sso-card {
            width: 100%;
            max-width: 26.25rem;
            text-align: center;
            background: var(--card);
            border: var(--layout-border-width) solid var(--border);
            border-radius: var(--layout-radius-lg);
            box-shadow: var(--shadow);
            padding: var(--layout-space-45);
        }
        .brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--layout-space-25);
            color: var(--accent);
            font-weight: var(--layout-font-weight-semibold);
            font-size: var(--layout-font-size-base);
            margin-bottom: var(--layout-space-45);
            text-align: start;
        }
        .brand .brand-text {
            color: var(--text);
        }
        .brand small {
            display: block;
            font-weight: var(--layout-font-weight-normal);
            color: var(--text-muted);
            font-size: var(--layout-font-size-xs);
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        .sso-title {
            font-size: var(--layout-font-size-xl);
            font-weight: var(--layout-font-weight-bold);
            color: var(--text);
            margin: 0 0 var(--layout-space-1);
        }
        .sso-subtitle {
            font-size: var(--layout-font-size-base);
            color: var(--text-muted);
            margin: 0;
        }
        .alert {
            margin-top: var(--layout-space-3);
            padding: var(--layout-space-2) var(--layout-space-25);
            border-radius: var(--layout-radius-sm);
            font-size: var(--layout-font-size-sm);
            border: var(--layout-border-width) solid transparent;
        }
        .alert-danger {
            background: var(--layout-error-soft);
            border-color: var(--layout-error-border);
            color: var(--layout-error-color);
        }
    `]
})
export class SsoCallbackComponent implements OnInit {
    errorMessage = '';

    constructor(
        private authService: AuthService,
        private layoutService: LayoutService,
        private router: Router
    ) {
    }

    ngOnInit(): void {
        if (!this.hasCallbackParams()) {
            this.restartSso();
            return;
        }

        this.authService.handleSsoCallback().subscribe({
            next: () => {
                this.layoutService.setAuthenticatedLayout();
                this.router.navigateByUrl(this.authService.consumePostLoginUrl());
            },
            error: err => {
                const message = err?.error || err?.message || 'SSO login failed';
                if (message === 'Invalid SSO callback') {
                    this.restartSso();
                    return;
                }
                this.errorMessage = message;
            }
        });
    }

    private hasCallbackParams(): boolean {
        const params = new URLSearchParams(window.location.search);
        return params.has('code') && params.has('state');
    }

    private restartSso(): void {
        this.authService.loginWithSso('/').subscribe({
            error: err => {
                this.errorMessage = err?.error || err?.message || 'SSO login failed';
            }
        });
    }
}
