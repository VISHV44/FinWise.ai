import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import CreditGauge from '../components/CreditGauge';
import LoadingSpinner from '../components/LoadingSpinner';

function FactorBar({ label, value, color, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color }}>{value}%</span>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 1s ease-out' }} />
      </div>
    </div>
  );
}

const TIPS = [
  'Maintain a savings rate above 20% to improve your score.',
  'Keep EMI payments below 40% of your monthly income.',
  'Regular salary credits boost income stability.',
  'Review flagged anomalies to protect against fraud.',
];

export default function CreditScore() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analysis/credit-score')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load credit score'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={40} /></div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{error}</p>
      <Link to="/upload" className="btn-primary" style={{ textDecoration: 'none' }}>Upload CSV</Link>
    </div>
  );

  const factors = [
    { label: 'Income Stability', value: data.income_stability, color: '#22D3EE' },
    { label: 'Debt Ratio', value: 100 - data.debt_ratio, color: '#34D399' },
    { label: 'Savings Discipline', value: data.savings_discipline, color: '#8B5CF6' },
    { label: 'Spend Regularity', value: data.spend_regularity, color: '#FBBF24' },
  ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Credit Score</h1>

      <div className="glass-card glow-indigo" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <CreditGauge score={data.score} grade={data.grade} />
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 className="chart-title">Score Factors</h3>
        {factors.map((f, i) => (
          <FactorBar key={f.label} label={f.label} value={f.value} color={f.color} delay={200 + i * 150} />
        ))}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 className="chart-title">Tips to Improve</h3>
        <ul style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIPS.map(tip => (
            <li key={tip} style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
