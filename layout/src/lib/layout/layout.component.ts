import { Component } from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import {LayoutService} from "../layout.service";
import {AuthService} from "@nexacore/auth";


@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule,TopbarComponent, SidebarComponent, RouterOutlet, AsyncPipe],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
    constructor(
        public layoutService: LayoutService,
        public authService: AuthService
    ) {
        console.log('layoutService.layout()',layoutService.layout())
    }

    onLogout(): void {
        this.authService.logout();
        this.layoutService.setPublicLayout();
    }
}
