export default function AnomalyBadge({ isAnomaly }) {
  return isAnomaly
    ? <span className="anomaly-badge">⚠ Anomaly</span>
    : <span className="safe-badge">✓ Normal</span>;
}
