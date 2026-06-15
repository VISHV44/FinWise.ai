export default function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const name = label ?? entry.name ?? entry.payload?.name ?? '';
  const rawValue = entry.value ?? entry.payload?.value;
  const formatted = valueFormatter
    ? valueFormatter(rawValue, name, entry)
    : rawValue;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{name}</p>
      <p className="chart-tooltip-value">{formatted}</p>
    </div>
  );
}

export function currencyTooltipFormatter(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export const chartTooltipCursor = { fill: 'rgba(34, 211, 238, 0.08)' };
