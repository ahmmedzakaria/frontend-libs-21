import { Injectable, signal } from '@angular/core';

export type HeaderMenuId = 'apps' | 'notifications' | 'tasks' | 'language' | 'theme' | 'tenant' | 'profile';

@Injectable({ providedIn: 'root' })
export class HeaderMenuService {
  readonly openId = signal<HeaderMenuId | null>(null);

  toggle(id: HeaderMenuId): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  close(): void {
    this.openId.set(null);
  }

  isOpen(id: HeaderMenuId): boolean {
    return this.openId() === id;
  }
}
