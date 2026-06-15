import { useState, useRef } from 'react';

export default function UploadZone({ onFileSelect, selectedFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
        background: dragging ? 'rgba(34, 211, 238, 0.05)' : 'transparent',
        boxShadow: dragging ? '0 0 30px rgba(34, 211, 238, 0.15)' : 'none',
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])} />
      <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Upload your bank statement CSV</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
        Drag & drop or click to browse
      </p>
      {selectedFile && (
        <div style={{
          marginTop: 16, padding: '8px 16px', background: 'rgba(34, 211, 238, 0.1)',
          borderRadius: 8, display: 'inline-block', fontSize: 13, color: 'var(--accent-light)',
        }}>
          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
        </div>
      )}
    </div>
  );
}
