const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value?: string | Date | null) {
  if (!value) return "Chưa có ngày";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có ngày";

  return DATE_FORMATTER.format(date);
}
