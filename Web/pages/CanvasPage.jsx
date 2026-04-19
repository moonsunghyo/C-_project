// src/pages/CanvasPage.jsx
// Student canvas — receives drawing data from the instructor via WebSocket.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';
import { Ico } from '../components/Icons';

const WS_URL = 'ws://localhost:8082';

export default function CanvasPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [connState, setConnState] = useState('waiting'); // 'waiting' | 'connected' | 'error'
  const [info, setInfo] = useState('서버 연결 대기 중...');

  const sessionCode = sessionStorage.getItem('adp_sessionCode') || '------';
  const participantName = sessionStorage.getItem('adp_name') || '참가자';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    let lastX = null;
    let lastY = null;
    let lastTime = Date.now();

    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setConnState('connected');
      setInfo('연결됨. 데이터를 기다리는 중...');
    };

    socket.onmessage = (event) => {
      const data = event.data.split(',');
      const relX = parseFloat(data[0]);
      const relY = parseFloat(data[1]);
      const colorIdx = parseInt(data[2], 10);

      const x = relX * canvas.width;
      const y = relY * canvas.height;

      // Gap > 100 ms → new stroke
      const now = Date.now();
      if (now - lastTime > 100) {
        lastX = null;
        lastY = null;
      }
      lastTime = now;

      ctx.strokeStyle = colorIdx === 0 ? '#1a1a2e' : '#6366f1';

      if (lastX !== null && lastY !== null) {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }

      lastX = x;
      lastY = y;
      setInfo(`수신 중: X(${x.toFixed(1)}), Y(${y.toFixed(1)})`);
    };

    socket.onerror = () => {
      setConnState('error');
      setInfo('연결 오류가 발생했습니다.');
    };

    socket.onclose = () => {
      setConnState('waiting');
      setInfo('서버와 연결이 끊겼습니다.');
    };

    return () => {
      socket.close();
    };
  }, []);

  const statusMap = {
    waiting:   { cls: 'sb-wait', label: '연결 대기 중', pulse: true },
    connected: { cls: 'sb-live', label: '연결됨',       pulse: false },
    error:     { cls: 'sb-err',  label: '연결 오류',    pulse: false },
  };
  const st = statusMap[connState];

  return (
    <div className="scanvas-page enter">
      {/* Header */}
      <div className="scanvas-nav">
        <BrandIcon size={24} />
        <div style={{ width: 1, height: 20, background: 'var(--dark-border)', margin: '0 .2rem' }} />
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '.8rem', letterSpacing: '.1em', color: 'var(--dark-fg-2)' }}>
          {sessionCode}
        </span>
        <div className={`status-badge ${st.cls}`}>
          <div className={`status-dot${st.pulse ? ' pulse' : ''}`} />
          &nbsp;{st.label}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '.8rem', color: 'var(--dark-fg-2)', marginRight: '.5rem' }}>
          {participantName}
        </span>
        <button
          className="btn-sm secondary"
          style={{ fontSize: '.78rem' }}
          onClick={() => navigate('/')}
        >
          ← 나가기
        </button>
      </div>

      {/* Canvas */}
      <div className="scanvas-body">
        <div className="scanvas-frame">
          <canvas
            ref={canvasRef}
            width={820}
            height={615}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="scanvas-info">
          <Ico.Wifi s={12} /> {info}
        </div>
      </div>
    </div>
  );
}
