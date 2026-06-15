import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import UploadZone from '../components/UploadZone';
import LoadingSpinner from '../components/LoadingSpinner';

const SAMPLE_CSV = `date,description,amount
2024-01-01,Salary Credit HDFC,55000
2024-01-03,Amazon Shopping,-2400
2024-01-05,Zomato Food Order,-450
2024-01-07,Electricity Bill BESCOM,-1200
2024-01-10,Home Loan EMI HDFC,-8500
2024-01-12,Netflix Subscription,-499
2024-01-15,Petrol Bunk BPCL,-3000
2024-01-18,Grocery DMart,-4200
2024-01-20,Unknown Transfer Midnight,-45000
2024-01-22,Duplicate Charge Amazon,-2400
2024-01-25,Apollo Pharmacy Medicine,-800
2024-01-28,Flipkart Shopping,-1800`;

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setWarnings([]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.warnings?.length) {
        // ML service had issues but upload succeeded — show warnings then navigate
        setWarnings(res.data.warnings);
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please check your CSV format.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Upload Data</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: 14 }}>
        Upload your bank statement CSV to analyse transactions, detect anomalies, and get AI insights.
      </p>

      {error && <div className="alert-error">{error}</div>}
      {warnings.length > 0 && (
        <div className="alert-warning" style={{ marginBottom: 16 }}>
          ⚠️ Upload succeeded but with warnings:
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {warnings.map((w, i) => <li key={i} style={{ fontSize: 13 }}>{w}</li>)}
          </ul>
          <p style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>Redirecting to dashboard…</p>
        </div>
      )}

      <UploadZone onFileSelect={setFile} selectedFile={file} />

      <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
        <button onClick={downloadSample} className="btn-secondary">Download sample CSV</button>
        <button onClick={handleUpload} className="btn-primary" disabled={!file || loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? <><LoadingSpinner size={18} /> Uploading...</> : 'Upload & Analyse'}
        </button>
      </div>
    </div>
  );
}
