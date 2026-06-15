export default function StatCard({ title, value, delta, deltaLabel, icon, color, invertDelta }) {
  const getDeltaStyle = (d) => {
    if (d === null || d === undefined) return null;
    const positive = invertDelta ? d < 0 : d > 0;
    return {
      color: positive ? 'var(--green)' : 'var(--red)',
      arrow: d > 0 ? '↑' : '↓',
      text: `${d > 0 ? '+' : ''}₹${Math.abs(d).toLocaleString('en-IN')} vs last month`,
    };
  };

  const deltaInfo = getDeltaStyle(delta);

  return (
    <div className="glass-card" style={{ padding: '1.25rem 1.35rem', minHeight: 118, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px',
            textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</p>
          <p className="mono stat-value" style={{ color: color || 'var(--text)' }}>{value}</p>
          {deltaInfo && (
            <p style={{
              fontSize: 11, color: deltaInfo.color, margin: '8px 0 0', fontWeight: 500,
              lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {deltaInfo.arrow} {deltaInfo.text}
            </p>
          )}
          {!deltaInfo && deltaLabel && (
            <p style={{
              fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0',
              lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>{deltaLabel}</p>
          )}
        </div>
        <span style={{
          fontSize: 22, flexShrink: 0, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-elevated)', borderRadius: 10,
        }}>{icon}</span>
      </div>
    </div>
  );
}
