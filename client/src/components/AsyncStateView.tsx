import type { ReactNode } from 'react';

type AsyncStateViewProps = {
  loading?: boolean;
  error?: { message: string } | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
};

/**
 * Shared loading / empty / error-with-retry presentation for data-backed screens.
 */
export function AsyncStateView({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Nothing to show yet.',
  onRetry,
  children,
}: AsyncStateViewProps) {
  if (loading) {
    return (
      <div className="async-state" role="status" aria-live="polite">
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="async-state async-state--error" role="alert">
        <p>{error.message}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="async-state async-state--empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return children;
}
