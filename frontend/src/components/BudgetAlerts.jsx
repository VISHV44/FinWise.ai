import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const ALERTS_PER_ROW = 4;

function AlertItem({ alert: a }) {
  const pct = Math.min(a.percentage, 100);
  const barColor = a.level === 'danger' ? 'var(--red)' : 'var(--amber)';

  return (
    <div className={`budget-alert-row budget-alert-row--${a.level}`}>
      <div className="budget-alert-row-top">
        <span className="budget-alert-category">{a.category}</span>
        <span className={`budget-alert-pct mono budget-alert-pct--${a.level}`}>{a.percentage}%</span>
      </div>
      <div className="budget-alert-bar-track">
        <div className="budget-alert-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <p className="budget-alert-meta">
        ₹{a.spent.toLocaleString('en-IN')} / ₹{a.budget.toLocaleString('en-IN')}
        {a.month ? ` · ${a.month}` : ''}
      </p>
    </div>
  );
}

export default function BudgetAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [visibleRows, setVisibleRows] = useState(1);

  useEffect(() => {
    api.get('/budgets/alerts').then(r => setAlerts(r.data)).catch(() => {});
  }, []);

  if (!alerts.length) return null;

  const totalRows = Math.ceil(alerts.length / ALERTS_PER_ROW);
  const visibleCount = Math.min(visibleRows * ALERTS_PER_ROW, alerts.length);
  const visible = alerts.slice(0, visibleCount);
  const hasMoreRows = visibleRows < totalRows;
  const dangerCount = alerts.filter(a => a.level === 'danger').length;
  const nextRowSize = Math.min(ALERTS_PER_ROW, alerts.length - visibleCount);

  return (
    <div className="glass-card budget-alerts-card">
      <div className="budget-alerts-header">
        <div>
          <h3 className="budget-alerts-title">Budget alerts</h3>
          <p className="budget-alerts-subtitle">
            {dangerCount > 0
              ? `${dangerCount} categor${dangerCount === 1 ? 'y' : 'ies'} over limit`
              : `${alerts.length} categor${alerts.length === 1 ? 'y' : 'ies'} nearing limit`}
          </p>
        </div>
        <Link to="/budgets" className="budget-alerts-link">Manage →</Link>
      </div>

      <div className="budget-alerts-list">
        {visible.map(a => (
          <AlertItem key={a.category} alert={a} />
        ))}
      </div>

      {totalRows > 1 && (
        <button
          type="button"
          className="budget-alerts-toggle"
          onClick={() => setVisibleRows(hasMoreRows ? r => r + 1 : 1)}
        >
          {hasMoreRows ? `Show more (${nextRowSize})` : 'Show less'}
        </button>
      )}
    </div>
  );
}
