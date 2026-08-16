import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { createTask, getTask, updateTask } from '../../api/tasks';
import { listUsers } from '../../api/users';
import { AsyncStateView } from '../../components/AsyncStateView';
import { ApiError, type UserDto } from '../../types/api';
import { TaskPriority, TaskStatus, type TaskInput } from '../../types/task';

type FormState = {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  assignedUserId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm = (defaults: Partial<FormState> = {}): FormState => ({
  title: '',
  description: '',
  priority: TaskPriority.Medium,
  status: TaskStatus.ToDo,
  dueDate: '',
  assignedUserId: '',
  ...defaults,
});

function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function TaskFormScreen() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { api, user, isAdministrator } = useAuth();

  const [form, setForm] = useState<FormState>(() =>
    emptyForm({ assignedUserId: user?.id ?? '' }),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<{ message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignees, setAssignees] = useState<UserDto[]>([]);

  useEffect(() => {
    if (!isAdministrator) return;
    let cancelled = false;
    (async () => {
      try {
        const users = await listUsers(api);
        if (!cancelled) {
          setAssignees(users.filter((item) => item.active));
        }
      } catch {
        if (!cancelled) setAssignees([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, isAdministrator]);

  useEffect(() => {
    if (!isEdit && user?.id) {
      setForm((current) =>
        current.assignedUserId ? current : { ...current, assignedUserId: user.id },
      );
    }
  }, [isEdit, user?.id]);

  useEffect(() => {
    if (!isEdit || !id) {
      setForm(emptyForm({ assignedUserId: user?.id ?? '' }));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const task = await getTask(api, id);
        if (cancelled) return;
        setForm({
          title: task.title,
          description: task.description ?? '',
          priority: task.priority,
          status: task.status,
          dueDate: toDateInputValue(task.dueDate),
          assignedUserId: task.assignedUserId,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setLoadError({ message: 'The task is unavailable.' });
        } else if (err instanceof ApiError) {
          setLoadError({ message: err.message });
        } else {
          setLoadError({ message: 'Unable to load this task.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, id, isEdit, user?.id]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateLocal(): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.priority) errors.priority = 'Priority is required';
    if (!form.assignedUserId.trim()) errors.assignedUserId = 'Assigned user is required';
    return errors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const localErrors = validateLocal();
    setFieldErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    const payload: TaskInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      status: form.status,
      assignedUserId: form.assignedUserId.trim(),
      ...(form.dueDate ? { dueDate: new Date(form.dueDate).toISOString() } : {}),
    };

    setSubmitting(true);
    try {
      const saved = isEdit && id ? await updateTask(api, id, payload) : await createTask(api, payload);
      navigate(`/tasks/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors?.length) {
          const next: FieldErrors = {};
          for (const item of err.errors) {
            const key = item.field as keyof FormState;
            next[key] = item.message;
          }
          setFieldErrors(next);
        }
        setFormError(err.message);
      } else {
        setFormError('Unable to save the task. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page task-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit task' : 'New task'}</h1>
        <Link to={isEdit && id ? `/tasks/${id}` : '/tasks'}>Cancel</Link>
      </div>

      <AsyncStateView
        loading={loading}
        error={loadError}
        empty={false}
        onRetry={() => {
          // Remount-driven reload via navigation is enough; force by resetting id dependency.
          if (id) navigate(`/tasks/${id}/edit`, { replace: true });
        }}
      >
        <form className="task-form" onSubmit={onSubmit} noValidate>
          {formError ? (
            <div className="form-banner" role="alert">
              {formError}
            </div>
          ) : null}

          <label className="field">
            <span>Title</span>
            <input
              value={form.title}
              disabled={submitting}
              onChange={(event) => updateField('title', event.target.value)}
            />
            {fieldErrors.title ? <span className="field-error">{fieldErrors.title}</span> : null}
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows={4}
              value={form.description}
              disabled={submitting}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Priority</span>
              <select
                value={form.priority}
                disabled={submitting}
                onChange={(event) => updateField('priority', event.target.value)}
              >
                {Object.values(TaskPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              {fieldErrors.priority ? (
                <span className="field-error">{fieldErrors.priority}</span>
              ) : null}
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                disabled={submitting}
                onChange={(event) => updateField('status', event.target.value)}
              >
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                value={form.dueDate}
                disabled={submitting}
                onChange={(event) => updateField('dueDate', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Assigned user</span>
              {isAdministrator ? (
                <select
                  value={form.assignedUserId}
                  disabled={submitting}
                  onChange={(event) => updateField('assignedUserId', event.target.value)}
                >
                  <option value="">Select a user</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name} ({assignee.email})
                    </option>
                  ))}
                </select>
              ) : (
                <input value={user?.name ?? 'You'} disabled readOnly />
              )}
              {fieldErrors.assignedUserId ? (
                <span className="field-error">{fieldErrors.assignedUserId}</span>
              ) : null}
            </label>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </form>
      </AsyncStateView>
    </section>
  );
}
