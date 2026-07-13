import { Injectable } from '@angular/core';

import { ResponseMessage } from './model/response-message.model';

export type NotificationLevel = 'info' | 'success' | 'error';

export interface NotificationMessage {
  level: NotificationLevel;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notify(message: NotificationMessage): void {
    const logger = message.level === 'error' ? console.error : console.info;
    logger(`[${message.level}] ${message.text}`);
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
