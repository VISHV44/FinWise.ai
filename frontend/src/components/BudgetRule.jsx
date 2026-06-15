import { useEffect, useState } from 'react';
import api from '../api/axios';

function RuleBar({ label, actual, target, invertGood }) {
  const isGood = invertGood ? actual >= target : actual <= target;
  const color = isGood ? 'var(--green)' : 'var(--red)';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
          <span style={{ color }}>{actual}%</span>
          <span style={{ color: 'var(--text-muted)' }}> / {target}% target</span>
        </span>
      </div>
      <div style={{ position: 'relative', background: 'var(--border)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${Math.min(target, 100)}%`, background: 'rgba(148,163,184,0.3)', borderRadius: 6,
        }} />
        <div style={{
          position: 'relative', width: `${Math.min(actual, 100)}%`, height: '100%',
          background: color, borderRadius: 6, transition: 'width 1s ease-out',
        }} />
      </div>
    </div>
  );
}

export default function BudgetRule() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analysis/budget-rule').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h3 className="chart-title" style={{ margin: 0 }}>50/30/20 Budget Rule</h3>
        <span title="Allocate 50% of income to needs, 30% to wants, and save 20%" style={{ cursor: 'help', fontSize: 14, color: 'var(--text-muted)' }}>ⓘ</span>
      </div>
      <RuleBar label="Needs" actual={data.actual.needs_pct} target={data.target.needs_pct} invertGood={false} />
      <RuleBar label="Wants" actual={data.actual.wants_pct} target={data.target.wants_pct} invertGood={false} />
      <RuleBar label="Savings" actual={data.actual.savings_pct} target={data.target.savings_pct} invertGood={true} />
    </div>
  );
}
