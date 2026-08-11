import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { THEME_COLOR_ROLES, ThemeService } from '@nexacore/platform';
import { ButtonComponent } from '../button/button.component';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

@Component({
    selector: 'app-color-palette',
    standalone: true,
    imports: [ButtonComponent],
    templateUrl: './color-palette.component.html',
    styleUrl: './color-palette.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPaletteComponent implements OnInit {
    private readonly themeService = inject(ThemeService);

    protected readonly roles = THEME_COLOR_ROLES;
    protected readonly colors = signal<Record<string, string>>({});

    ngOnInit(): void {
        this.readCurrentColors();
    }

    protected onColorInput(key: string, event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.colors.update((current) => ({ ...current, [key]: value }));
        this.themeService.setCustomColor(key, value);
    }

    protected reset(): void {
        this.themeService.clearCustomColors();
        this.readCurrentColors();
    }

    private readCurrentColors(): void {
        const styles = getComputedStyle(document.body);
        const next: Record<string, string> = {};
        for (const role of this.roles) {
            const raw = styles.getPropertyValue(role.cssVar).trim();
            next[role.key] = HEX_COLOR_PATTERN.test(raw) ? raw : '#000000';
        }
        this.colors.set(next);
    }
}
