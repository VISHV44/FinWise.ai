import { useState, useEffect } from 'react';
import api from '../api/axios';
import TransactionTable from '../components/TransactionTable';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/transactions/?page=${page}&size=20&anomaly_only=${anomalyOnly}`)
      .then(res => {
        setTransactions(res.data.transactions);
        setTotal(res.data.total);
        const cats = [...new Set(res.data.transactions.map(t => t.category).filter(Boolean))];
        setCategories(prev => [...new Set([...prev, ...cats])]);
      })
      .finally(() => setLoading(false));
  }, [page, anomalyOnly]);

  const filtered = transactions.filter(t => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && t.category !== category) return false;
    return true;
  });

  const totalPages = Math.ceil(total / 20);

  const handleCategoryUpdate = (txId, newCategory) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, category: newCategory } : t));
  };

  const exportCsv = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/transactions/export`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finwise-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Transactions</h1>

      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Search descriptions..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={anomalyOnly} onChange={e => { setAnomalyOnly(e.target.checked); setPage(1); }} />
          Anomalies only
        </label>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }} onClick={exportCsv}>
          📥 Export CSV
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><LoadingSpinner size={36} /></div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No transactions found</p>
        ) : (
          <TransactionTable
            transactions={filtered}
            expandedId={expandedId}
            onRowClick={tx => tx.is_anomaly && setExpandedId(expandedId === tx.id ? null : tx.id)}
            onCategoryUpdate={handleCategoryUpdate}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 16px', fontSize: 13 }}>Previous</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 16px', fontSize: 13 }}>Next</button>
        </div>
      )}
    </div>
  );
}
