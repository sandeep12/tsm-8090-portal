import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="page page--centered">
      <h1>Access denied</h1>
      <p>You do not have permission to open this page.</p>
      <Link to="/">Back to dashboard</Link>
    </div>
  );
}
