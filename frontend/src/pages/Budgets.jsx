import { useState, useEffect } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ["Salary", "EMI", "Groceries", "Entertainment", "Fuel", "Utilities", "Healthcare", "Shopping", "Dining", "Transfer"];

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [spendByCat, setSpendByCat] = useState({});
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/budgets/'),
      api.get('/analysis/summary').catch(() => null),
    ]).then(([budgetRes, summaryRes]) => {
      setBudgets(budgetRes.data);
      if (summaryRes) {
        setSpendByCat(summaryRes.data.current_month_categories || summaryRes.data.top_categories || {});
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!limit || parseFloat(limit) <= 0) return;
    setSaving(true);
    try {
      await api.post('/budgets/', { category, monthly_limit: parseFloat(limit) });
      setLimit('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    await api.delete(`/budgets/${cat}`);
    load();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={40} /></div>
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Budget Limits</h1>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 className="chart-title">Set Category Budget</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14, outline: 'none' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Monthly limit (₹)</label>
            <input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="5000" required min="1"
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '8px 20px' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '0.5rem' }}>
        {budgets.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No budgets set yet</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Category', 'Limit', 'Spent', 'Progress', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => {
                const spent = spendByCat[b.category] || 0;
                const pct = Math.min((spent / b.monthly_limit) * 100, 100);
                const barColor = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--green)';
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.category}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>₹{b.monthly_limit.toLocaleString('en-IN')}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>₹{spent.toLocaleString('en-IN')}</td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ background: 'var(--border)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 6, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(b.category)} className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }} title="Delete">🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
