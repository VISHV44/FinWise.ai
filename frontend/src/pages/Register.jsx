import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { email, password, full_name: fullName });
      navigate('/login', { state: { message: 'Account created! Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card glow-indigo auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="auth-logo">💹</div>
          <h1 className="page-title">Create Account</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14 }}>Join FinWise AI for free</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name', type: 'text', value: fullName, set: setFullName, placeholder: 'John Doe' },
            { label: 'Email address', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com' },
            { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••', hint: 'Min. 8 characters' },
            { label: 'Confirm Password', type: 'password', value: confirmPassword, set: setConfirmPassword, placeholder: '••••••••' },
          ].map(({ label, type, value, set, placeholder, hint }) => (
            <div key={label}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>{label}</label>
              <input type={type} className="auth-input" value={value} onChange={e => set(e.target.value)}
                placeholder={placeholder} required minLength={type === 'password' && label === 'Password' ? 8 : undefined} />
              {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
