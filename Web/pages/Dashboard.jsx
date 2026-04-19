// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';
import { Ico } from '../components/Icons';

// ── Mock data (replace with API calls) ──────────────────────────────────────
const MOCK_SESSIONS = [
  { code: 'AB12CD', title: '자료구조 3주차', live: true,  date: '오늘 14:30', participants: ['김', '이', '박', '최', '정'], views: 18 },
  { code: 'XY89ZW', title: '알고리즘 특강',  live: false, date: '어제 10:00', participants: ['강', '윤', '오'],         views: 24 },
  { code: 'PQ34RS', title: 'OOP 개념 정리',  live: false, date: '4월 15일',   participants: ['장', '임', '한', '신'],   views: 31 },
];

const AVATAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div style={{
      flex: '1 1 120px', minWidth: 120,
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 10, padding: '.9rem 1.1rem',
    }}>
      <div style={{ fontSize: '.75rem', color: 'var(--fg-3)', marginBottom: '.2rem' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-.02em' }}>{value}</div>
    </div>
  );
}

function SessionCard({ session, onOpen }) {
  return (
    <div
      className="session-card"
      onClick={() => session.live && onOpen()}
    >
      <div className="card-header">
        <div className="card-code">{session.code}</div>
        <div className={`card-badge ${session.live ? 'live' : 'ended'}`}>
          {session.live && <div className="status-dot pulse" />}
          {session.live ? '진행 중' : '종료됨'}
        </div>
      </div>

      <div className="card-title">{session.title}</div>
      <div className="card-meta">{session.date}</div>

      <div className="card-footer">
        <div className="participants-row">
          {session.participants.slice(0, 4).map((p, i) => (
            <div
              key={i}
              className="p-avatar"
              style={{
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                marginLeft: i > 0 ? -6 : 0,
                zIndex: 10 - i,
              }}
            >
              {p}
            </div>
          ))}
          {session.participants.length > 4 && (
            <div className="p-avatar" style={{ background: 'var(--fg-3)', marginLeft: -6 }}>
              +{session.participants.length - 4}
            </div>
          )}
        </div>
        <span style={{ fontSize: '.78rem', color: 'var(--fg-3)' }}>
          {session.views}명 총 참가
        </span>
      </div>

      {session.live && (
        <div style={{ marginTop: '.75rem' }}>
          <button
            className="btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
          >
            <Ico.Play s={13} /> 캔버스 열기
          </button>
        </div>
      )}
    </div>
  );
}

function CreateSessionModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [step, setStep] = useState(1);
  const generatedCode = 'AB12CD'; // TODO: generate from API

  const handleNext = (e) => {
    e.preventDefault();
    if (title.trim()) setStep(2);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal enter">
        {step === 1 ? (
          <>
            <h2 className="modal-title">새 세션 만들기</h2>
            <p className="modal-sub">세션 정보를 입력하면 참가 코드가 자동으로 생성돼요.</p>
            <form onSubmit={handleNext}>
              <div className="field">
                <label className="flabel">세션 이름</label>
                <input
                  className="finput"
                  placeholder="예: 자료구조 4주차"
                  value={title}
                  autoFocus
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="flabel">최대 참가자 수</label>
                <select className="finput" style={{ cursor: 'pointer' }}>
                  <option>제한 없음</option>
                  <option>30명</option>
                  <option>50명</option>
                  <option>100명</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-s" onClick={onClose}>
                  <Ico.X s={13} /> 취소
                </button>
                <button type="submit" className="btn-p" disabled={!title.trim()}>
                  다음 <Ico.Arrow s={14} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="modal-title">세션이 생성됐어요!</h2>
            <p className="modal-sub">아래 코드를 학생들과 공유하세요.</p>
            <div className="code-preview">
              <p>세션 코드</p>
              <div className="code-big">{generatedCode}</div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
              <button
                className="btn-sm secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => navigator.clipboard?.writeText(generatedCode)}
              >
                <Ico.Copy s={13} /> 복사하기
              </button>
              <button className="btn-sm secondary" style={{ flex: 1, justifyContent: 'center' }}>
                <Ico.Users s={13} /> 링크 공유
              </button>
            </div>
            <div className="modal-footer">
              <button className="btn-s" onClick={onClose}><Ico.X s={13} /> 나중에</button>
              <button className="btn-p" onClick={onCreated}><Ico.Play s={13} /> 캔버스 열기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'live'  ? MOCK_SESSIONS.filter((s) => s.live) :
    filter === 'ended' ? MOCK_SESSIONS.filter((s) => !s.live) :
    MOCK_SESSIONS;

  const totalParticipants = MOCK_SESSIONS.reduce((acc, s) => acc + s.participants.length, 0);

  return (
    <div className="dash enter">
      {/* Top nav */}
      <nav className="dash-nav">
        <BrandIcon size={26} />
        <span style={{ fontWeight: 600, fontSize: '.95rem' }}>C-Project</span>
        <div className="dash-spacer" />
        <button className="btn-sm" onClick={() => setShowCreate(true)}>
          <Ico.Plus s={14} /> 새 세션
        </button>
        {/* TODO: replace with real user data */}
        <div className="nav-avatar" title="강기현 교수">강</div>
      </nav>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="sidebar-sec">
            <div className="sidebar-label">메뉴</div>
            <div className="sidebar-item active"><Ico.Grid s={14} /> 세션 목록</div>
            <div className="sidebar-item" onClick={() => navigate('/canvas')}>
              <Ico.Pen s={14} /> 캔버스 열기
            </div>
          </div>
          <div className="sidebar-sec">
            <div className="sidebar-label">필터</div>
            {[['all', '전체'], ['live', '진행 중'], ['ended', '종료됨']].map(([v, l]) => (
              <div
                key={v}
                className={`sidebar-item${filter === v ? ' active' : ''}`}
                onClick={() => setFilter(v)}
              >
                {l}
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div className="sidebar-item"><Ico.Settings s={14} /> 설정</div>
        </aside>

        {/* Main content */}
        <main className="dash-main">
          <div className="dash-header">
            <div>
              <h1 className="section-title">세션 목록</h1>
              <p className="section-sub">강사님의 모든 세션을 관리하세요.</p>
            </div>
            <button className="btn-sm" onClick={() => setShowCreate(true)}>
              <Ico.Plus s={14} /> 새 세션 만들기
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <StatCard label="전체 세션" value={`${MOCK_SESSIONS.length}개`} />
            <StatCard label="진행 중" value={`${MOCK_SESSIONS.filter((s) => s.live).length}개`} />
            <StatCard label="총 참가자" value={`${totalParticipants}명`} />
          </div>

          {/* Session cards */}
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <h3>세션이 없어요</h3>
              <p>새 세션을 만들어 시작해보세요.</p>
              <button className="btn-sm" onClick={() => setShowCreate(true)}>
                <Ico.Plus s={14} /> 새 세션 만들기
              </button>
            </div>
          ) : (
            <div className="session-grid">
              {filtered.map((s) => (
                <SessionCard
                  key={s.code}
                  session={s}
                  onOpen={() => navigate('/canvas')}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateSessionModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); navigate('/canvas'); }}
        />
      )}
    </div>
  );
}
