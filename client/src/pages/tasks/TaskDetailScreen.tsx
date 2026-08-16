import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { changeTaskStatus, deleteTask, getTask } from '../../api/tasks';
import { AsyncStateView } from '../../components/AsyncStateView';
import { ApiError } from '../../types/api';
import { TaskStatus, type TaskDto } from '../../types/task';
import { taskAssigneeLabel, taskDueLabel } from './taskDisplay';

export function TaskDetailScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { api, user, isAdministrator } = useAuth();
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [statusValue, setStatusValue] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canManage =
    Boolean(task) && (isAdministrator || task?.assignedUserId === user?.id);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const item = await getTask(api, id);
      setTask(item);
      setStatusValue(item.status);
    } catch (err) {
      setTask(null);
      if (err instanceof ApiError && err.status === 404) {
        setError({ message: 'The task is unavailable.' });
      } else if (err instanceof ApiError && err.status === 403) {
        setError({ message: err.message || 'You do not have permission to view this task.' });
      } else if (err instanceof ApiError) {
        setError({ message: err.message });
      } else {
        setError({ message: 'Unable to load this task. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onStatusSave() {
    if (!task || !canManage || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await changeTaskStatus(api, task.id, statusValue);
      setTask(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to update status.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!task || !canManage || busy) return;
    const confirmed = window.confirm(`Delete task “${task.title}”? This cannot be undone.`);
    if (!confirmed) return;

    setBusy(true);
    setActionError(null);
    try {
      await deleteTask(api, task.id);
      navigate('/tasks');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to delete task.');
      setBusy(false);
    }
  }

  return (
    <section className="page task-page">
      <div className="page-header">
        <h1>Task detail</h1>
        <Link to="/tasks">Back to list</Link>
      </div>

      <AsyncStateView
        loading={loading}
        error={error}
        empty={false}
        onRetry={() => {
          void load();
        }}
      >
        {task ? (
          <div className="task-detail">
            <h2>{task.title}</h2>
            <dl className="detail-grid">
              <div>
                <dt>Description</dt>
                <dd>{task.description?.trim() ? task.description : '—'}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{task.priority}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{task.status}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{taskDueLabel(task.dueDate)}</dd>
              </div>
              <div>
                <dt>Assigned user</dt>
                <dd>{taskAssigneeLabel(task.assignedUserId, user?.id)}</dd>
              </div>
            </dl>

            {actionError ? (
              <div className="form-banner" role="alert">
                {actionError}
              </div>
            ) : null}

            {canManage ? (
              <div className="task-actions">
                <label className="field field--inline">
                  <span>Change status</span>
                  <select
                    value={statusValue}
                    disabled={busy}
                    onChange={(event) => setStatusValue(event.target.value)}
                  >
                    {Object.values(TaskStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" disabled={busy} onClick={() => void onStatusSave()}>
                  Save status
                </button>
                <Link className="button-link" to={`/tasks/${task.id}/edit`}>
                  Edit
                </Link>
                <button type="button" className="button-danger" disabled={busy} onClick={() => void onDelete()}>
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </AsyncStateView>
    </section>
  );
}
