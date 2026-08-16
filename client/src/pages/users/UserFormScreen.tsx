import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { createUser, getUser, updateUser } from '../../api/users';
import { AsyncStateView } from '../../components/AsyncStateView';
import { ApiError, type UserRole } from '../../types/api';

type FormState = {
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  password: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm = (): FormState => ({
  name: '',
  email: '',
  role: 'User',
  active: true,
  password: '',
});

export function UserFormScreen() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { api } = useAuth();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<{ message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) {
      setForm(emptyForm());
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const user = await getUser(api, id);
        if (cancelled) return;
        setForm({
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          password: '',
        });
      } catch (err) {
        if (cancelled) return;
        setLoadError({
          message:
            err instanceof ApiError
              ? err.message
              : 'Unable to load this user. Please try again.',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, id, isEdit]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateLocal(): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (!isEdit && form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (isEdit && form.password && form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    return errors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const localErrors = validateLocal();
    setFieldErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateUser(api, id, {
          name: form.name.trim(),
          email: form.email.trim(),
          ...(form.password ? { password: form.password } : {}),
        });
        // Role/active are managed from the directory for clarity; still allow create defaults.
      } else {
        await createUser(api, {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          active: form.active,
        });
      }
      navigate('/users');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors?.length) {
          const next: FieldErrors = {};
          for (const item of err.errors) {
            next[item.field as keyof FormState] = item.message;
          }
          setFieldErrors(next);
        }
        setFormError(err.message);
      } else {
        setFormError('Unable to save the user. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page user-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit user' : 'New user'}</h1>
        <Link to="/users">Cancel</Link>
      </div>

      <AsyncStateView
        loading={loading}
        error={loadError}
        empty={false}
        onRetry={() => {
          if (id) navigate(`/users/${id}/edit`, { replace: true });
        }}
      >
        <form className="task-form" onSubmit={onSubmit} noValidate>
          {formError ? (
            <div className="form-banner" role="alert">
              {formError}
            </div>
          ) : null}

          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              disabled={submitting}
              onChange={(event) => updateField('name', event.target.value)}
            />
            {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              disabled={submitting}
              onChange={(event) => updateField('email', event.target.value)}
            />
            {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
          </label>

          {!isEdit ? (
            <>
              <label className="field">
                <span>Role</span>
                <select
                  value={form.role}
                  disabled={submitting}
                  onChange={(event) => updateField('role', event.target.value as UserRole)}
                >
                  <option value="User">User</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </label>

              <label className="field">
                <span>Active status</span>
                <select
                  value={form.active ? 'active' : 'inactive'}
                  disabled={submitting}
                  onChange={(event) => updateField('active', event.target.value === 'active')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </>
          ) : null}

          <label className="field">
            <span>{isEdit ? 'New password (optional)' : 'Initial password'}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              disabled={submitting}
              onChange={(event) => updateField('password', event.target.value)}
            />
            {fieldErrors.password ? (
              <span className="field-error">{fieldErrors.password}</span>
            ) : null}
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          </button>
        </form>
      </AsyncStateView>
    </section>
  );
}
