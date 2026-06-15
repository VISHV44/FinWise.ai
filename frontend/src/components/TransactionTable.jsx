import { useState } from 'react';
import { Fragment } from 'react';
import api from '../api/axios';
import AnomalyBadge from './AnomalyBadge';

const CATEGORIES = ["Salary", "EMI", "Groceries", "Entertainment", "Fuel", "Utilities", "Healthcare", "Shopping", "Dining", "Transfer", "Other"];

function CategoryEditor({ txId, currentCategory, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(currentCategory || 'Other');

  const save = async (val) => {
    await api.patch(`/transactions/${txId}/category`, { category: val });
    onUpdate(txId, val);
    setEditing(false);
  };

  if (editing) {
    return (
      <select
        value={selected}
        autoFocus
        onChange={e => { setSelected(e.target.value); save(e.target.value); }}
        onBlur={() => setEditing(false)}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '2px 6px' }}
      >
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    );
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Click to edit category"
      style={{ cursor: 'pointer' }}
      className="category-pill"
    >
      {currentCategory || 'Uncategorised'} ✎
    </span>
  );
}

function AnomalyInfo({ explanation }) {
  const [show, setShow] = useState(false);
  if (!explanation) return null;
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 6 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ cursor: 'help', fontSize: 13, color: 'var(--text-muted)' }}>ⓘ</span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px', fontSize: 12, maxWidth: 260, zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', lineHeight: 1.4,
        }}>
          {explanation}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderTop: '6px solid var(--border)',
          }} />
        </div>
      )}
    </span>
  );
}

export default function TransactionTable({ transactions, onRowClick, expandedId, onCategoryUpdate }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {['Date', 'Description', 'Amount', 'Category', 'Status'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <Fragment key={tx.id}>
              <tr
                onClick={() => onRowClick?.(tx)}
                style={{
                  cursor: tx.is_anomaly ? 'pointer' : 'default',
                  background: expandedId === tx.id ? 'rgba(34, 211, 238, 0.05)' : 'transparent',
                }}
              >
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                <td className="desc-cell" title={tx.description}>{tx.description}</td>
                <td className="mono" style={{
                  fontWeight: 600, whiteSpace: 'nowrap',
                  color: tx.transaction_type === 'credit' ? 'var(--green)' : 'var(--red)',
                }}>
                  {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <CategoryEditor txId={tx.id} currentCategory={tx.category} onUpdate={onCategoryUpdate} />
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <AnomalyBadge isAnomaly={tx.is_anomaly} />
                    {tx.is_anomaly && <AnomalyInfo explanation={tx.explanation} />}
                  </span>
                </td>
              </tr>
              {expandedId === tx.id && tx.is_anomaly && (
                <tr>
                  <td colSpan={5} style={{ padding: '12px 16px', background: 'var(--red-dim)' }}>
                    {tx.explanation && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px' }}>{tx.explanation}</p>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Risk Score</div>
                    <div style={{ background: 'var(--border)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(tx.anomaly_score || 0) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--red), var(--amber))',
                        borderRadius: 6,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>
                      {((tx.anomaly_score || 0) * 100).toFixed(1)}% anomaly confidence
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
