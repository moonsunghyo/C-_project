import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [name, setName] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (sessionCode.trim().length >= 4 && name.trim()) {
      sessionStorage.setItem('adp_sessionCode', sessionCode.toUpperCase());
      sessionStorage.setItem('adp_name', name);
      navigate('/canvas');
    }
  };

  const handleCreateHost = () => {
    alert('구현 예정');
  };

  return (
    <div className="split-layout">
      {/* Mobile Top Bar */}
      <div className="mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <Box size={24} />
          C-Project
        </div>
      </div>

      {/* Left Branding Panel */}
      <div className="split-left">
        <div className="left-pattern-overlay" />
        <div className="left-content">
          <div className="brand-title">
            <Box size={32} />
            C-Project
          </div>
        </div>

        <div className="left-content">
          <h2 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em', color: '#333333ff' }}>
            실시간 화이트보드 협업 플랫폼
          </h2>
          <p className="brand-desc" style={{ color: '#4d5053ff' }}>
            강사가 개설한 보드에 접속하여, 대화형 학습과 양방향 커뮤니케이션을 시작하세요. 언제 어디서나 빠르게 아이디어를 공유할 수 있습니다.
          </p>
        </div>

        <div className="left-content" style={{ fontSize: '0.85rem', color: 'rgba(0, 0, 0, 0.5)' }}>
          &copy; 2026 C-Project for Advanced Programming.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="split-right">
        <div className="form-container">
          <div className="form-header">
            <h2>세션 참가하기</h2>
            <p>공유받은 세션 코드와 사용할 이름을 입력해주세요.</p>
          </div>

          <form onSubmit={handleJoin}>
            <div className="input-group">
              <label className="input-label" htmlFor="sessionCode">세션 코드</label>
              <input
                id="sessionCode"
                type="text"
                placeholder="예: AB12CD"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                className="saas-input"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="name">참가자 이름</label>
              <input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="saas-input"
                maxLength={15}
              />
            </div>

            <button
              type="submit"
              className="saas-btn"
              disabled={sessionCode.trim().length === 0 || name.trim().length === 0}
            >
              참가하기
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="divider">또는</div>

          <button onClick={handleCreateHost} className="secondary-btn">
            강사로 세션 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
