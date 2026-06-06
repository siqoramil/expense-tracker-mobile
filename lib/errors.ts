import { ApiError, NetworkError, TimeoutError } from './api';
import { tStr, type Lang } from './i18n';

const SERVER_CODE_KEYS = new Set<string>([
  'email_taken',
  'invalid_credentials',
  'account_locked',
  'account_link_required',
  'google_account_in_use',
  'email_mismatch',
  'invalid_google_token',
  'google_auth_disabled',
  'password_required',
  'id_token_required',
  'invalid_code',
  'code_expired',
  'too_many_attempts',
  'same_email',
  'invalid_state',
  'not_found',
  'invalid_avatar',
  'mail_send_failed',
  'wallet_not_found',
  'invalid_amount',
  'email_not_verified',
]);

const statusKey = (status: number): string => {
  if (status === 401) return 'err_session_expired';
  if (status === 429) return 'err_too_many_requests';
  if (status === 400) return 'err_validation';
  if (status >= 500) return 'err_server';
  return 'err_unknown';
};

export const errorMessage = (lang: Lang, err: unknown): string => {
  if (err instanceof NetworkError) return tStr(lang, 'err_network');
  if (err instanceof TimeoutError) return tStr(lang, 'err_timeout');
  if (err instanceof ApiError) {
    if (SERVER_CODE_KEYS.has(err.message)) return tStr(lang, `err_${err.message}`);
    return tStr(lang, statusKey(err.status));
  }
  if (err instanceof TypeError) return tStr(lang, 'err_network');
  return tStr(lang, 'err_unknown');
};

export const isNetworkError = (err: unknown): boolean =>
  err instanceof NetworkError || err instanceof TimeoutError || err instanceof TypeError;

export const isReachabilityError = isNetworkError;
