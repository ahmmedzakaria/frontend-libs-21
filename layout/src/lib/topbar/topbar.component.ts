import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../layout.service';
import {RouterLink} from "@angular/router";
import { FormsModule } from '@angular/forms';
import { I18nService, SupportedLocale } from '@nexacore/shared/i18n/i18n.service';
import { TranslatePipe } from '@nexacore/shared/i18n/translate.pipe';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
    @Input() theme: 'light' | 'dark' = 'light';
    @Input() user: any;
    @Output() logout = new EventEmitter<void>();

    isMenuOpen = true;

    constructor(public layoutService: LayoutService, public i18nService: I18nService) {}

    get selectedLocale(): SupportedLocale {
        return this.i18nService.locale();
    }

    toggleSidebar() {
        this.layoutService.toggleSidebar();
    }

    toggleTheme(): void {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.theme = newTheme;
        this.layoutService.setTheme(newTheme);
        document.body.setAttribute('data-bs-theme', newTheme);
    }

    onLogout() {
        this.logout.emit();
        console.log("logout");
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    async changeLanguage(locale: string): Promise<void> {
        await this.i18nService.use(locale);
    }
}
