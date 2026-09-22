export type AuthKind = 'login' | 'register' | 'forgot' | 'reset';
export type AuthValues = Record<string, string>;
export type FieldErrors = Record<string, string>;
export const recoveryMessage = 'If an account exists for that email, password reset instructions have been sent.';
export const invalidResetMessage = 'This password reset link is invalid or expired. Request a new link to try again.';
const labels: Record<string, string> = { first_name: 'First name', last_name: 'Last name', user_name: 'Username', email: 'Email', password: 'Password', password_confirmation: 'Password confirmation' };
const fieldsFor = (kind: AuthKind) => kind === 'register' ? Object.keys(labels) : kind === 'forgot' ? ['email'] : kind === 'reset' ? ['email', 'password', 'password_confirmation'] : ['email', 'password'];

export function validateAuth(kind: AuthKind, values: AuthValues): FieldErrors {
  const fields = fieldsFor(kind);
  const errors: FieldErrors = {};
  for (const field of fields) {
    const value = values[field] || '';
    if (!value.trim()) errors[field] = `${labels[field]} is required.`;
    else if (field === 'email' && !/^[^\s@]+@[^\s@]+$/.test(value.trim())) errors[field] = 'Enter a valid email address.';
    else if (!field.startsWith('password') && Array.from(value.trim()).length > 255) errors[field] = `${labels[field]} must be 255 characters or fewer.`;
  }
  if (kind === 'register' || kind === 'reset') {
    const length = Array.from(values.password || '').length;
    if (length && (length < 8 || length > 4096)) errors.password = 'Use between 8 and 4096 characters.';
    if (values.password_confirmation && values.password !== values.password_confirmation) errors.password_confirmation = 'Passwords do not match.';
  }
  return errors;
}

// Only known validation messages are translated. Never surface exception text.
export function authFailure(kind: AuthKind, error: { status?: number; data?: { errors?: Record<string, unknown>; message?: unknown } }): { errors: FieldErrors; message: string } {
  const errors: FieldErrors = {};
  const status = error.status;
  if (status === 400 || status === 422) {
    const legacy = Array.isArray(error.data?.message) ? error.data.message.filter((value): value is string => typeof value === 'string') : [];
    for (const [field, label] of Object.entries(labels)) {
      if (!fieldsFor(kind).includes(field)) continue;
      const messages = error.data?.errors?.[field];
      const matched = legacy.filter(message => message.toLowerCase().startsWith(`the ${field.replaceAll('_', ' ')} `));
      const list = Array.isArray(messages) ? messages.filter((value): value is string => typeof value === 'string') : matched;
      if (!list.length) continue;
      if ((field === 'email' || field === 'user_name') && list.some(message => message.includes('already been taken'))) errors[field] = `${label} is already in use.`;
      else if (field === 'password' && kind !== 'login' && list.some(message => message.includes('confirmation'))) errors.password_confirmation = 'Passwords do not match.';
      else errors[field] = field === 'password' && kind !== 'login' ? 'Use between 8 and 4096 characters.' : `Check your ${label.toLowerCase()} and try again.`;
    }
    return { errors, message: Object.keys(errors).length ? '' : kind === 'reset' ? invalidResetMessage : 'Please check your details and try again.' };
  }
  return { errors, message: status === 401 && kind === 'login' ? 'Invalid email or password.' : status === 429 ? 'Too many attempts. Please wait a minute before trying again.' : status ? 'We could not complete your request. Please try again shortly.' : 'Could not connect. Check your connection and try again.' };
}
