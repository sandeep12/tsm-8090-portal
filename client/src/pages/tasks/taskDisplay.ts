function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function formatAssignee(assignedUserId: string, currentUserId?: string | null): string {
  if (currentUserId && assignedUserId === currentUserId) {
    return 'You';
  }
  return assignedUserId.slice(-6);
}

export function taskDueLabel(value?: string): string {
  return formatDate(value);
}

export function taskAssigneeLabel(assignedUserId: string, currentUserId?: string | null): string {
  return formatAssignee(assignedUserId, currentUserId);
}
