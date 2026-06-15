import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine,
} from 'recharts';
import api from '../api/axios';
import ChartTooltip, { currencyTooltipFormatter, chartTooltipCursor } from '../components/ChartTooltip';
import StatCard from '../components/StatCard';
import AnomalyBadge from '../components/AnomalyBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import BudgetAlerts from '../components/BudgetAlerts';
import BudgetRule from '../components/BudgetRule';

const PIE_COLORS = ['#22D3EE', '#8B5CF6', '#34D399', '#FBBF24', '#F87171', '#60A5FA'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [credit, setCredit] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [trend, setTrend] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analysis/summary'),
      api.get('/analysis/credit-score').catch(() => null),
      api.get('/transactions/?page=1&size=5'),
      api.get('/analysis/monthly-trend').catch(() => null),
      api.get('/analysis/forecast').catch(() => null),
    ])
      .then(([sumRes, creditRes, txRes, trendRes, forecastRes]) => {
        setSummary(sumRes.data);
        if (creditRes) setCredit(creditRes.data);
        setTransactions(txRes.data.transactions);
        if (trendRes) setTrend(trendRes.data);
        if (forecastRes) setForecast(forecastRes.data);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const downloadReport = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/reports/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finwise-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <LoadingSpinner size={40} />
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{error}</p>
      <Link to="/upload" className="btn-primary" style={{ textDecoration: 'none' }}>Upload CSV</Link>
    </div>
  );

  const totalIncome = summary.total_income ?? summary.monthly_income;
  const totalSpend = summary.total_spend ?? summary.monthly_spend;
  const barData = [
    { name: 'Income', amount: totalIncome },
    { name: 'Spend', amount: totalSpend },
  ];
  const pieData = Object.entries(summary.top_categories).map(([name, value]) => ({ name, value }));

  const spendTrendData = (trend?.months || []).map(m => ({
    month: m.month,
    income: m.income,
    actualSpend: m.spend,
    forecastSpend: null,
  }));
  if (forecast?.predicted_spend != null && forecast?.next_month && spendTrendData.length > 0) {
    spendTrendData[spendTrendData.length - 1].forecastSpend = spendTrendData[spendTrendData.length - 1].actualSpend;
    spendTrendData.push({
      month: forecast.next_month,
      income: null,
      actualSpend: null,
      forecastSpend: forecast.predicted_spend,
    });
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: 16, flexWrap: 'wrap' }}>
        <h1 className="page-title">Dashboard</h1>
        <button
          className="btn-primary"
          style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={downloadReport}
        >
          📄 Download Report
        </button>
      </div>

      <BudgetAlerts />

      <div className="stat-grid">
        <StatCard
          title="Total Income" value={`₹${totalIncome.toLocaleString('en-IN')}`}
          deltaLabel="All uploaded data" color="var(--green)" icon="💰"
        />
        <StatCard
          title="Total Spend" value={`₹${totalSpend.toLocaleString('en-IN')}`}
          deltaLabel="All uploaded data" color="var(--red)" icon="💸"
        />
        <StatCard
          title="Savings Rate" value={`${summary.savings_rate}%`}
          deltaLabel="All uploaded data" color="var(--blue)" icon="📈"
        />
        <StatCard
          title="Credit Score" value={credit?.score ?? '—'}
          deltaLabel={credit?.grade}
          color="var(--accent)" icon="🎯"
        />
        {forecast?.predicted_spend != null ? (
          <StatCard
            title="Predicted Spend"
            value={`₹${forecast.predicted_spend.toLocaleString('en-IN')}`}
            deltaLabel={`${forecast.next_month} · ${forecast.confidence} confidence`}
            color="var(--accent-secondary)" icon="🔮"
          />
        ) : (
          <StatCard
            title="Predicted Spend"
            value="—"
            deltaLabel="Need ≥2 months of data"
            color="var(--text-muted)" icon="🔮"
          />
        )}
      </div>

      <div className="chart-grid">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 className="chart-title">Income vs Spend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={52} />
              <Tooltip content={<ChartTooltip valueFormatter={currencyTooltipFormatter} />} cursor={chartTooltipCursor} />
              <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} activeBar={{ fill: 'url(#barGradient)', opacity: 0.85 }} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card pie-chart-card" style={{ padding: '1.5rem' }}>
          <h3 className="chart-title">Spend by Category</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <Pie
                    data={pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={78} innerRadius={42}
                    paddingAngle={2} stroke="none"
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueFormatter={currencyTooltipFormatter} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="pie-legend-item" title={`${entry.name}: ₹${entry.value.toLocaleString('en-IN')}`}>
                    <span className="pie-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="pie-legend-name">{entry.name}</span>
                    <span className="pie-legend-value mono">₹{entry.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No category data yet</p>
          )}
        </div>
      </div>

      {spendTrendData.length >= 2 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 className="chart-title">Monthly Income & Spend Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={spendTrendData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={52} />
              <Tooltip content={<ChartTooltip valueFormatter={currencyTooltipFormatter} />} />
              {trend?.months?.length > 0 && forecast?.predicted_spend != null && (
                <ReferenceLine x={trend.months[trend.months.length - 1].month} stroke="var(--accent-secondary)" strokeDasharray="4 4" />
              )}
              <Line type="monotone" dataKey="income" stroke="#34D399" strokeWidth={2.5} dot={{ r: 4, fill: '#34D399' }} name="Income" connectNulls={false} />
              <Line type="monotone" dataKey="actualSpend" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 4, fill: '#22D3EE' }} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="forecastSpend" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: '#8B5CF6' }} name="Forecast" connectNulls={false} />
              <Legend iconType="line" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <BudgetRule />
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <h3 className="chart-title">Recent Transactions</h3>
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
              <tr key={tx.id}>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                <td className="desc-cell" title={tx.description}>{tx.description}</td>
                <td className="mono" style={{ fontWeight: 600, color: tx.transaction_type === 'credit' ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                  {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </td>
                <td>
                  {tx.category && <span className="category-pill">{tx.category}</span>}
                </td>
                <td><AnomalyBadge isAnomaly={tx.is_anomaly} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link to="/chat" style={{
        position: 'fixed', bottom: 32, right: 32, width: 56, height: 56, borderRadius: '50%',
        background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 24, textDecoration: 'none',
        boxShadow: '0 4px 24px rgba(34, 211, 238, 0.35)', zIndex: 50,
      }}>🤖</Link>
    </div>
  );
}
