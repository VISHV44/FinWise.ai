import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',    icon: '📊', label: 'Dashboard'    },
  { to: '/transactions', icon: '💳', label: 'Transactions'  },
  { to: '/credit-score', icon: '🎯', label: 'Credit Score'  },
  { to: '/budgets',      icon: '💰', label: 'Budgets'       },
  { to: '/chat',         icon: '🤖', label: 'AI Advisor'    },
  { to: '/upload',       icon: '📂', label: 'Upload Data'   },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist theme in localStorage so it survives navigation
  const [light, setLight] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('light-mode', light);
    localStorage.setItem('theme', light ? 'light' : 'dark');
  }, [light]);

  const toggleTheme = () => setLight(l => !l);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
        style={{
          display: 'none',
          position: 'fixed', top: 16, left: 16, zIndex: 200,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 8, width: 40, height: 40, fontSize: 18,
          cursor: 'pointer', color: 'var(--text)', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none', position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 99,
          }}
          className="sidebar-overlay"
        />
      )}

    <aside className={`app-sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem', paddingLeft: 8 }}>
        <span style={{
          fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--accent-gradient)', borderRadius: 10,
        }}>💹</span>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>FinWise AI</span>
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', minHeight: 0 }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: 'none',
            color: isActive ? 'var(--text)' : 'var(--text-muted)',
            background: isActive ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          })}>
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{user?.email}</div>
        <button onClick={toggleTheme} className="btn-secondary" style={{ width: '100%', fontSize: 12, padding: '8px 12px', marginBottom: 8 }}>
          {light ? '🌙 Dark mode' : '☀️ Light mode'}
        </button>
        <button onClick={logout} className="btn-secondary" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }}>Sign out</button>
      </div>
    </aside>
    </>
  );
}
