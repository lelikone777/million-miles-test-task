export function formatYen(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Н/Д";
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Н/Д";
  }
  return `${new Intl.NumberFormat("ru-RU").format(value)} км`;
}

export function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
