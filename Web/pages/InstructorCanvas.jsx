// src/pages/InstructorCanvas.jsx
// Instructor's drawing board — draws locally and broadcasts via WebSocket.
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';
import { Ico } from '../components/Icons';

const DRAW_COLORS = ['#1a1a2e', '#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#ef4444'];

// TODO: replace with real participant data from WebSocket/API
const MOCK_PARTICIPANTS = [
  { name: '김민준', color: '#22c55e' },
  { name: '이서연', color: '#f59e0b' },
  { name: '박지호', color: '#ec4899' },
  { name: '최유진', color: '#06b6d4' },
  { name: '정하은', color: '#f97316' },
];

export default function InstructorCanvas() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');       // 'pen' | 'eraser'
  const [color, setColor] = useState('#1a1a2e');
  const [brushSize, setBrushSize] = useState(3); // 2 | 4 | 8
  const [elapsed, setElapsed] = useState(0);     // seconds
  const drawing = useRef(false);
  const last = useRef(null);

  // Session timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  // Drawing handlers
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    return {
      x: (e.clientX - r.left) * sx,
      y: (e.clientY - r.top) * sy,
    };
  };

  const startDraw = (e) => {
    drawing.current = true;
    last.current = getPos(e);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);

    ctx.lineWidth = tool === 'eraser' ? brushSize * 6 : brushSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // TODO: send drawing data to WebSocket server
    // ws.send(JSON.stringify({ x: x / canvas.width, y: y / canvas.height, color }));

    last.current = { x, y };
  };

  const endDraw = () => {
    drawing.current = false;
    last.current = null;
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="icanvas-page enter">
      {/* Header / toolbar */}
      <div className="icanvas-nav">
        <BrandIcon size={24} />
        <div style={{ width: 1, height: 20, background: 'var(--dark-border)', margin: '0 .2rem' }} />
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '.8rem', color: 'var(--dark-fg-2)', letterSpacing: '.1em' }}>
          AB12CD
        </span>
        <div className="status-badge sb-live">
          <div className="status-dot" /> 진행 중
        </div>

        {/* Drawing toolbar — centered */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div className="toolbar">
            {/* Tool: pen / eraser */}
            <button
              className={`tool-btn${tool === 'pen' ? ' on' : ''}`}
              title="펜"
              onClick={() => setTool('pen')}
            >
              <Ico.Pen s={14} />
            </button>
            <button
              className={`tool-btn${tool === 'eraser' ? ' on' : ''}`}
              title="지우개"
              onClick={() => setTool('eraser')}
            >
              <Ico.Eraser s={14} />
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--dark-border)', margin: '0 4px' }} />

            {/* Color palette */}
            {DRAW_COLORS.map((c) => (
              <div
                key={c}
                className={`color-dot${color === c ? ' on' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}

            <div style={{ width: 1, height: 20, background: 'var(--dark-border)', margin: '0 4px' }} />

            {/* Brush size */}
            {[{ sz: 2, label: 'S' }, { sz: 4, label: 'M' }, { sz: 8, label: 'L' }].map(({ sz, label }) => (
              <button
                key={sz}
                className={`tool-btn${brushSize === sz ? ' on' : ''}`}
                onClick={() => setBrushSize(sz)}
                style={{ fontSize: '.68rem', fontWeight: 600 }}
                title={`굵기 ${label}`}
              >
                {label}
              </button>
            ))}

            <div style={{ width: 1, height: 20, background: 'var(--dark-border)', margin: '0 4px' }} />

            {/* Clear */}
            <button className="tool-btn" title="전체 지우기" onClick={clearCanvas}>
              <Ico.Trash s={14} />
            </button>
          </div>
        </div>

        <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.8rem', color: 'var(--dark-fg-2)' }}>
          <Ico.Users s={13} /> {MOCK_PARTICIPANTS.length}명
        </span>

        <button className="btn-sm secondary" onClick={() => navigate('/dashboard')} style={{ fontSize: '.78rem' }}>
          ← 대시보드
        </button>
      </div>

      {/* Body */}
      <div className="icanvas-body">
        {/* Canvas area */}
        <div className="icanvas-area">
          <div className="icanvas-frame">
            <canvas
              ref={canvasRef}
              width={820}
              height={615}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="icanvas-sidebar">
          {/* Participants */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              className="i-sec-label"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              참가자
              <span className="badge-count">{MOCK_PARTICIPANTS.length}</span>
            </div>
            {MOCK_PARTICIPANTS.map((p, i) => (
              <div key={i} className="i-p-item">
                <div className="i-p-dot" style={{ background: p.color }} />
                {p.name}
              </div>
            ))}
          </div>

          {/* Session info */}
          <div>
            <div className="i-sec-label">세션 정보</div>
            <div style={{ fontSize: '.8rem', color: 'var(--dark-fg-2)', lineHeight: 1.9 }}>
              <div>코드: <span style={{ fontFamily: 'DM Mono, monospace', letterSpacing: '.1em', color: 'var(--accent-mid)' }}>AB12CD</span></div>
              <div>서버: localhost:8082</div>
              <div>지속시간: {fmtTime(elapsed)}</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* End session */}
          <button
            className="btn-sm"
            style={{ width: '100%', justifyContent: 'center', background: 'oklch(0.55 0.22 25 / .8)' }}
            onClick={() => navigate('/dashboard')}
          >
            세션 종료
          </button>
        </div>
      </div>
    </div>
  );
}
