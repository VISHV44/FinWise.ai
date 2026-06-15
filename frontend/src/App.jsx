import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CreditScore from './pages/CreditScore';
import AIChat from './pages/AIChat';
import Budgets from './pages/Budgets';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 14 }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/dashboard"    element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
          <Route path="/credit-score" element={<ProtectedLayout><CreditScore /></ProtectedLayout>} />
          <Route path="/chat"         element={<ProtectedLayout><AIChat /></ProtectedLayout>} />
          <Route path="/budgets"      element={<ProtectedLayout><Budgets /></ProtectedLayout>} />
          <Route path="/upload"       element={<ProtectedLayout><Upload /></ProtectedLayout>} />
          <Route path="*"             element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
