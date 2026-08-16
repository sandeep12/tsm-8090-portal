import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../types/api';

type FieldErrors = {
  email?: string;
  password?: string;
};

/**
 * Sign-in screen: credentials form with progress, validation, and ErrorResponse messages.
 */
export function SignInScreen() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/sign-in'
      ? (location.state as { from: string }).from
      : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!password) nextErrors.password = 'Password is required';
    setFieldErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Unable to sign in right now. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--centered">
      <form className="sign-in-form" onSubmit={onSubmit} noValidate>
        <h1>Sign in</h1>
        <p className="sign-in-lead">Access your tasks and dashboard.</p>

        {formError ? (
          <div className="form-banner" role="alert">
            {formError}
          </div>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password ? (
            <span className="field-error">{fieldErrors.password}</span>
          ) : null}
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
