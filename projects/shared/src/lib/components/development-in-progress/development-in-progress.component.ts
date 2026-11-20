import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-development-in-progress',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './development-in-progress.component.html',
    styleUrl: './development-in-progress.component.scss'
})
export class DevelopmentInProgressComponent {
    protected readonly requestedPath = inject(Router).url.split('?')[0].split('#')[0];
}
