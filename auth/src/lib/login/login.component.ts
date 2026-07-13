import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import {AuthService} from "../auth.service";
import {LayoutService} from "@nexacore/layout";
import {NgIf} from "@angular/common";


@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [
        ReactiveFormsModule,
        NgIf
    ],

})
export class LoginComponent implements OnInit {
    form: FormGroup;
    errorMessage = '';
    passwordLoginEnabled = false;
    ssoLoginEnabled = false;
    loadingConfig = true;
    ssoLoading = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private layoutService: LayoutService
    ) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.authService.loadAuthConfig().subscribe({
            next: config => {
                this.passwordLoginEnabled = this.authService.isLoginMethodEnabled(config, 'PASSWORD');
                this.ssoLoginEnabled = this.authService.isLoginMethodEnabled(config, 'SSO');
                this.loadingConfig = false;
            },
            error: err => {
                this.errorMessage = err?.error || err?.message || 'Authentication config load failed';
                this.loadingConfig = false;
            }
        });
    }

    login() {
        if (this.form.invalid) return;
        if (!this.passwordLoginEnabled) {
            this.errorMessage = 'LOCAL_LOGIN_DISABLED';
            return;
        }

        const { username, password } = this.form.value;

        this.authService.login(username, password).subscribe({
            next: () => {
                console.log('login success setting layout');
                this.layoutService.setAuthenticatedLayout(); // ✅ switch layout
                this.router.navigate(['']);
            },
            error: err => {
                this.errorMessage = err?.error || err?.message || 'Login failed';
            }
        });
    }

    loginWithSso() {
        this.ssoLoading = true;
        this.errorMessage = '';

        this.authService.loginWithSsoAfterLogout('/').subscribe({
            error: err => {
                this.ssoLoading = false;
                this.errorMessage = err?.error || err?.message || 'SSO login failed';
            }
        });
    }
}
