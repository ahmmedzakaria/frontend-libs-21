import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBarComponent {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clock = signal(this.formatTime());

  constructor() {
    const id = setInterval(() => this.clock.set(this.formatTime()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
