import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { listUsers, setUserActive, setUserRole } from '../../api/users';
import { AsyncStateView } from '../../components/AsyncStateView';
import { ApiError, type UserDto, type UserRole } from '../../types/api';

const ROLES: UserRole[] = ['Administrator', 'User'];

export function UserDirectoryScreen() {
  const { api, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      setUsers(await listUsers(api));
    } catch (err) {
      setUsers([]);
      setError({
        message:
          err instanceof ApiError ? err.message : 'Unable to load users. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggleActive(target: UserDto) {
    if (busyId) return;
    if (target.active) {
      const confirmed = window.confirm(
        `Deactivate “${target.name}”? They will lose access on their next request.`,
      );
      if (!confirmed) return;
    }

    setBusyId(target.id);
    setActionError(null);
    try {
      const updated = await setUserActive(api, target.id, !target.active);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to update active status.');
    } finally {
      setBusyId(null);
    }
  }

  async function onRoleChange(target: UserDto, role: UserRole) {
    if (busyId || role === target.role) return;
    setBusyId(target.id);
    setActionError(null);
    try {
      const updated = await setUserRole(api, target.id, role);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to update role.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="page user-page">
      <div className="page-header">
        <h1>Users</h1>
        <Link className="button-link" to="/users/new">
          New user
        </Link>
      </div>

      {actionError ? (
        <div className="form-banner" role="alert">
          {actionError}
        </div>
      ) : null}

      <AsyncStateView
        loading={loading}
        error={error}
        empty={!loading && !error && users.length === 0}
        emptyMessage="No user accounts yet."
        onRetry={() => {
          void load();
        }}
      >
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => {
                const busy = busyId === item.id;
                const isSelf = item.id === currentUser?.id;
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>
                      <select
                        value={item.role}
                        disabled={busy}
                        onChange={(event) =>
                          void onRoleChange(item, event.target.value as UserRole)
                        }
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{item.active ? 'Active' : 'Inactive'}</td>
                    <td className="user-actions">
                      <Link to={`/users/${item.id}/edit`}>Edit</Link>
                      <button
                        type="button"
                        className={item.active ? 'button-danger' : 'button-secondary'}
                        disabled={busy || (isSelf && item.active)}
                        title={
                          isSelf && item.active
                            ? 'You cannot deactivate your own account here'
                            : undefined
                        }
                        onClick={() => void onToggleActive(item)}
                      >
                        {item.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AsyncStateView>
    </section>
  );
}
