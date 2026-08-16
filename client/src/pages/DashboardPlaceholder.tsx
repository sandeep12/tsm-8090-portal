import { AsyncStateView } from '../components/AsyncStateView';

/** Shell demo of AsyncStateView; real dashboard is WO-9. */
export function DashboardPlaceholder() {
  return (
    <section className="page">
      <h1>Dashboard</h1>
      <AsyncStateView empty emptyMessage="Dashboard data will appear here once the API is wired.">
        {null}
      </AsyncStateView>
    </section>
  );
}
