import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { listTasks } from '../../api/tasks';
import { AsyncStateView } from '../../components/AsyncStateView';
import { ApiError } from '../../types/api';
import { TaskPriority, TaskStatus, type TaskDto } from '../../types/task';
import { taskAssigneeLabel, taskDueLabel } from './taskDisplay';

export function TaskListScreen() {
  const { api, user } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listTasks(api, {
        q: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTasks(items);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to load tasks. Please try again.';
      setError({ message });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [api, search, statusFilter, priorityFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(searchInput.trim() || statusFilter || priorityFilter);
  const emptyMessage = hasFilters
    ? 'No tasks match your search or filters.'
    : 'No tasks yet. Create one to get started.';

  return (
    <section className="page task-page">
      <div className="page-header">
        <h1>Tasks</h1>
        <Link className="button-link" to="/tasks/new">
          New task
        </Link>
      </div>

      <div className="task-toolbar">
        <label className="field field--inline">
          <span>Search</span>
          <input
            type="search"
            value={searchInput}
            placeholder="Search by title"
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <label className="field field--inline">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field field--inline">
          <span>Priority</span>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="">All</option>
            {Object.values(TaskPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        {hasFilters ? (
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <AsyncStateView
        loading={loading}
        error={error}
        empty={!loading && !error && tasks.length === 0}
        emptyMessage={emptyMessage}
        onRetry={() => {
          void load();
        }}
      >
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                  </td>
                  <td>{task.priority}</td>
                  <td>{task.status}</td>
                  <td>{taskDueLabel(task.dueDate)}</td>
                  <td>{taskAssigneeLabel(task.assignedUserId, user?.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncStateView>
    </section>
  );
}
