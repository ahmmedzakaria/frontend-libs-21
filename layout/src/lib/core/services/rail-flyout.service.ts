import { Injectable, signal } from '@angular/core';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NavItem } from '../models/nav-module.model';

export interface FlyoutContent {
  moduleId: string;
  moduleLabel: string;
  category: string;
  items: NavItem[];
}

@Injectable({ providedIn: 'root' })
export class RailFlyoutService {
  readonly content = signal<FlyoutContent | null>(null);
  readonly origin = signal<CdkOverlayOrigin | null>(null);
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  open(content: FlyoutContent, origin: CdkOverlayOrigin): void {
    clearTimeout(this.closeTimer);
    this.origin.set(origin);
    this.content.set(content);
  }

  scheduleClose(delayMs = 200): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => this.content.set(null), delayMs);
  }

  cancelClose(): void {
    clearTimeout(this.closeTimer);
  }

  close(): void {
    clearTimeout(this.closeTimer);
    this.content.set(null);
  }
}
