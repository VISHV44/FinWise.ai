import { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartTooltip, { currencyTooltipFormatter, chartTooltipCursor } from '../components/ChartTooltip';
import api from '../api/axios';
import ChatBubble from '../components/ChatBubble';

const SUGGESTIONS = [
  'Where am I overspending?',
  'Can I afford ₹8,000 EMI?',
  "What's my biggest expense?",
  'How to improve my credit score?',
];

function AIChart({ chartData }) {
  if (!chartData || chartData.length === 0) return null;
  return (
    <div style={{
      marginTop: 10, padding: '12px 8px 4px', background: 'var(--bg-primary)',
      borderRadius: 10, border: '1px solid var(--border)',
    }}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false}
            interval={0} angle={-20} textAnchor="end" height={48} />
          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={48}
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<ChartTooltip valueFormatter={currencyTooltipFormatter} />} cursor={chartTooltipCursor} />
          <Bar dataKey="value" fill="#22D3EE" radius={[4, 4, 0, 0]} activeBar={{ fill: '#22D3EE', opacity: 0.85 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm FinWise, your AI financial advisor. Ask me anything about your finances.", isUser: false, chartData: null },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const question = text.trim();
    setInput('');
    setMessages(prev => [...prev, { text: question, isUser: true, chartData: null }]);
    setLoading(true);
    try {
      const res = await api.post('/analysis/chat', { question });
      setMessages(prev => [...prev, {
        text: res.data.answer,
        isUser: false,
        chartData: res.data.chartData ?? null,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'Sorry, I could not connect to the AI advisor. Make sure Ollama is running.',
        isUser: false,
        chartData: null,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', margin: '-2rem', padding: '2rem' }}>
      <h1 className="page-title" style={{ marginBottom: '1rem' }}>AI Advisor</h1>

      <div style={{ display: 'flex', flex: 1, gap: 16, minHeight: 0 }}>
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <ChatBubble message={msg.text} isUser={msg.isUser} />
                {!msg.isUser && msg.chartData && (
                  <div style={{ maxWidth: '85%', width: '100%' }}>
                    <AIChart chartData={msg.chartData} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-ai" style={{ display: 'inline-flex', gap: 4, padding: '12px 16px' }}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', display: 'flex', gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about your finances..."
              style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            />
            <button onClick={() => sendMessage(input)} className="btn-primary" disabled={loading || !input.trim()}>Send</button>
          </div>
        </div>

        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Suggestions</p>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => { setInput(s); sendMessage(s); }}
              className="btn-secondary" style={{ textAlign: 'left', fontSize: 13, padding: '10px 14px', lineHeight: 1.4 }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
