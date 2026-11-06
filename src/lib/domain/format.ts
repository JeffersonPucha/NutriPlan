export const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
export const quantity = (value: number, unit: string) => `${new Intl.NumberFormat("es-EC", { maximumFractionDigits: 2 }).format(value)} ${unit}`;
export function dayLabel(createdAt: string, index: number, short = false) {
  const date = new Date(createdAt); date.setDate(date.getDate() + index);
  return new Intl.DateTimeFormat("es-EC", { weekday: short ? "short" : "long", day: "numeric", ...(!short && { month: "short" }) }).format(date);
}
