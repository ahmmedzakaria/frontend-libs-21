import { HttpContextToken } from '@angular/common/http';
import { ActionTypes } from './action-types';

/**
 * Carries an endpoint's ActionTypes through to apiResponseInterceptor, which
 * only sees the raw HttpRequest — this is what lets it auto-toast success
 * only for mutating calls (CREATE/UPDATE/DELETE), not every SEARCH/LOGIN.
 */
export const ACTION_TYPE_CONTEXT = new HttpContextToken<ActionTypes | undefined>(() => undefined);
