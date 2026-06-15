import { useEffect, useState } from 'react';

function getScoreColor(score) {
  if (score >= 800) return '#34D399';
  if (score >= 740) return '#6EE7B7';
  if (score >= 670) return '#FBBF24';
  if (score >= 580) return '#F59E0B';
  return '#F87171';
}

export default function CreditGauge({ score, grade }) {
  const [animated, setAnimated] = useState(false);
  const color = getScoreColor(score);
  const radius = 90;
  const circumference = Math.PI * radius;
  const progress = ((score - 300) / 600) * circumference;
  const offset = circumference - (animated ? progress : 0);
  const scoreFontSize = score >= 100 ? 40 : 48;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0 0' }}>
      <svg width="240" height="130" viewBox="0 0 240 130" style={{ display: 'block', margin: '0 auto' }}>
        <path
          d="M 30 110 A 90 90 0 0 1 210 110"
          fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round"
        />
        <path
          d="M 30 110 A 90 90 0 0 1 210 110"
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
        <text x="120" y="78" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={scoreFontSize} fontWeight="600"
          fontFamily="'JetBrains Mono', monospace">{score}</text>
      </svg>
      <div style={{
        fontSize: 15, fontWeight: 600, color, marginTop: 2,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>{grade}</div>
    </div>
  );
}
