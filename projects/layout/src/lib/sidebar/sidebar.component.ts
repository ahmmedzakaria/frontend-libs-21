import { Component, Input, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import {animate, state, style, transition, trigger} from "@angular/animations";
import {SidebarMenuItem, SidebarMenuService} from "../sidebar-menu.service";
import { TranslatePipe } from '@nexacore/shared';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [NgFor, NgIf, RouterLink, RouterLinkActive, TranslatePipe],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    animations: [
        trigger('slideToggle', [
            transition(':enter', [
                style({ height: 0, opacity: 0, overflow: 'hidden' }),
                animate('250ms ease-out', style({ height: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                style({ height: '*', opacity: 1, overflow: 'hidden' }),
                animate('250ms ease-in', style({ height: 0, opacity: 0 }))
            ])
        ]),
        trigger('rotateArrow', [
            state('collapsed', style({ transform: 'rotate(0deg)' })),
            state('expanded', style({ transform: 'rotate(90deg)' })),
            transition('collapsed <=> expanded', animate('200ms ease'))
        ])
    ]
})
export class SidebarComponent implements OnInit {
    constructor(private sidebarMenuService: SidebarMenuService) {}

    @Input() collapsed = false;

    expandedMenus = signal<Set<string>>(new Set());
    menuItems: SidebarMenuItem[] = [];
    loading = true;

    ngOnInit(): void {
        this.sidebarMenuService.loadSidebarMenu().subscribe({
            next: menuItems => {
                this.menuItems = menuItems || [];
                this.loading = false;
            },
            error: () => {
                this.menuItems = [];
                this.loading = false;
            }
        });
    }

    hasChildren(item: SidebarMenuItem): boolean {
        return !!item.children?.length;
    }

    handleMenuClick(item: SidebarMenuItem): void {
        if (this.hasChildren(item)) {
            this.toggleSubMenu(item.label);
        }
    }

    toggleSubMenu(label: string) {
        const expandedMenus = new Set(this.expandedMenus());
        if (expandedMenus.has(label)) {
            expandedMenus.delete(label);
        } else {
            expandedMenus.add(label);
        }
        this.expandedMenus.set(expandedMenus);
    }

    isExpanded(label: string): boolean {
        return this.expandedMenus().has(label);
    }

    menuLabelKey(label: string): string {
        const normalizedLabel = label
            .trim()
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '.')
            .replace(/^\.+|\.+$/g, '');

        return normalizedLabel ? `nav.${normalizedLabel}` : 'nav.unknown';
    }
}
