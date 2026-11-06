export function Progress({ value, label }: { value: number; label: string }) {
  return <progress className="progress" aria-label={label} max={100} value={Math.max(0, Math.min(100, value))} />;
}
