export default function LoadingSpinner({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size,
      border: '3px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
