/** Precise remaining time — no rounding up to whole days */
export function formatTimeRemaining(
  deadline: Date,
  overdueLabel: string
): { text: string; urgent: boolean } {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return { text: overdueLabel, urgent: true };

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let text: string;
  if (days > 0) {
    text = `${days}d ${hours}h`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else {
    text = `${minutes}m`;
  }

  return { text, urgent: days === 0 && hours < 24 };
}

/** Exact scheduled deadline date & time */
export function formatDeadlineDateTime(deadline: Date): string {
  return deadline.toLocaleString(undefined, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** @deprecated use formatTimeRemaining */
export function formatDaysRemaining(
  deadline: Date,
  overdueLabel: string
): { text: string; urgent: boolean } {
  return formatTimeRemaining(deadline, overdueLabel);
}
