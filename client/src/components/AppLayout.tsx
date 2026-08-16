import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Minimal chrome for authenticated routes (feature screens arrive later). */
export function AppLayout() {
  const { user, isAdministrator, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">TSM Portal</div>
        <nav className="app-nav">
          <Link to="/">Dashboard</Link>
          <Link to="/tasks">Tasks</Link>
          {isAdministrator ? <Link to="/users">Users</Link> : null}
        </nav>
        <div className="app-session">
          <span>{user?.name}</span>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
