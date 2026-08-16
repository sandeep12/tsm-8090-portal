import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getDashboardSummary } from '../api/dashboard';
import { AsyncStateView } from '../components/AsyncStateView';
import { ApiError } from '../types/api';
import type { DashboardSummary } from '../types/dashboard';
import { taskDueLabel } from './tasks/taskDisplay';

export function DashboardScreen() {
  const { api } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummary(api);
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setError({
        message:
          err instanceof ApiError ? err.message : 'Unable to load the dashboard. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = summary?.counts;
  const recent = summary?.recentTasks ?? [];
  const isEmptyScope = Boolean(summary && counts && counts.total === 0);

  return (
    <section className="page dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link className="button-link" to="/tasks">
          View tasks
        </Link>
      </div>

      <AsyncStateView
        loading={loading}
        error={error}
        empty={false}
        onRetry={() => {
          void load();
        }}
      >
        {summary && counts ? (
          <>
            <div className="dash-counts" aria-label="Task summary counts">
              <div className="dash-count-card">
                <span className="dash-count-label">Total</span>
                <strong className="dash-count-value">{counts.total}</strong>
              </div>
              <div className="dash-count-card">
                <span className="dash-count-label">To Do</span>
                <strong className="dash-count-value">{counts.toDo}</strong>
              </div>
              <div className="dash-count-card">
                <span className="dash-count-label">In Progress</span>
                <strong className="dash-count-value">{counts.inProgress}</strong>
              </div>
              <div className="dash-count-card">
                <span className="dash-count-label">Done</span>
                <strong className="dash-count-value">{counts.done}</strong>
              </div>
            </div>

            <div className="dash-recent">
              <h2>Recent activity</h2>
              {isEmptyScope || recent.length === 0 ? (
                <div className="async-state async-state--empty">
                  <p>No recent tasks in your scope.</p>
                </div>
              ) : (
                <div className="task-table-wrap">
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((task) => (
                        <tr key={task.id}>
                          <td>
                            <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                          </td>
                          <td>{task.status}</td>
                          <td>{taskDueLabel(task.dueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </AsyncStateView>
    </section>
  );
}
