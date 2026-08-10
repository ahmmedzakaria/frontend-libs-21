import { Injectable, signal } from '@angular/core';

import { ResponseMessage } from './model/response-message.model';

export type NotificationLevel = 'info' | 'success' | 'error';

export interface NotificationMessage {
  level: NotificationLevel;
  text: string;
}

export interface ToastMessage extends NotificationMessage {
  id: number;
}

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  notify(message: NotificationMessage): void {
    const toast: ToastMessage = { id: ++this.nextId, ...message };
    this._toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), AUTO_DISMISS_MS);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  notifyApiMessages(messages: ResponseMessage[] | undefined): void {
    messages?.forEach((message) => {
      this.notify({
        level: this.toLevel(message.type),
        text: message.message
      });
    });
  }

  private toLevel(type: ResponseMessage['type']): NotificationLevel {
    if (type === 'SUCCESS') {
      return 'success';
    }

    if (type === 'ERROR') {
      return 'error';
    }

    return 'info';
  }
}
