import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export default function Timer({ totalSeconds, onExpire, testId, token }) {
  const [secs, setSecs] = useState(totalSeconds);
  const wsRef = useRef(null);

  // WebSocket heartbeat to server
  useEffect(() => {
    if (!testId || !token) return;
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws'}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'HEARTBEAT', testId }));
        }
      }, 30000);
      ws._interval = interval;
    };

    ws.onclose = () => clearInterval(ws._interval);
    return () => { clearInterval(ws._interval); ws.close(); };
  }, [testId, token]);

  // Countdown
  useEffect(() => {
    if (secs <= 0) { onExpire?.(); return; }
    const t = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [secs]);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pct = totalSeconds > 0 ? (secs / totalSeconds) * 100 : 100;
  const urgent = pct < 20;
  const warning = pct < 40;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-base font-bold tabular-nums transition-colors ${urgent ? 'bg-red-50 border-red-200 text-red-700' : warning ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-blue-50 border-blue-200 text-brand'}`}>
      <Clock size={16} className={urgent ? 'animate-pulse' : ''} />
      <span>{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>
    </div>
  );
}
