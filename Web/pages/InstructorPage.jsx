// src/pages/InstructorPage.jsx
// Handles both login and signup for instructors.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SplitLeft from '../components/SplitLeft';
import { Ico } from '../components/Icons';

export default function InstructorPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [touch, setTouch] = useState({});
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  // Reset state when switching mode
  useEffect(() => {
    setTouch({});
    setOk(false);
  }, [mode]);

  // Inline validation
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const errs = {};
  if (touch.email && !emailOk)                        errs.email = '올바른 이메일 주소를 입력해주세요';
  if (touch.pw    && pw.length < 6)                   errs.pw    = '비밀번호는 6자 이상이어야 합니다';
  if (mode === 'signup' && touch.name && !name.trim()) errs.name  = '이름을 입력해주세요';

  const canSubmit = emailOk && pw.length >= 6 && (mode === 'login' || name.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched =
      mode === 'signup'
        ? { name: true, email: true, pw: true }
        : { email: true, pw: true };
    setTouch(allTouched);

    if (!canSubmit) return;

    setLoading(true);

    // TODO: replace with real API call
    // login:  POST /api/auth/login   { email, password }
    // signup: POST /api/auth/signup  { name, email, password }
    setTimeout(() => {
      setLoading(false);
      setOk(true);
      setTimeout(() => navigate('/dashboard'), 800);
    }, 1100);
  };

  return (
    <div className="split enter">
      <SplitLeft
        tag="강사 전용"
        headline="세션을 만들고<br/><span>학생들과</span><br/>연결하세요"
        desc="강사 계정으로 로그인하면 세션을 개설하고 실시간 화이트보드를 공유할 수 있어요."
      />

      <div className="split-right">
        <div className="form-box">
          <p className="eyebrow">강사</p>
          <h1 className="form-title">
            {mode === 'login' ? '다시 만나요 👋' : '계정 만들기'}
          </h1>
          <p className="form-sub">
            {mode === 'login'
              ? '계정에 로그인하여 새 세션을 시작해보세요.'
              : '강사 계정을 생성하고 첫 세션을 열어보세요.'}
          </p>

          {/* Mode tabs */}
          <div className="tabs">
            <button
              className={`tab${mode === 'login' ? ' on' : ''}`}
              onClick={() => setMode('login')}
            >
              로그인
            </button>
            <button
              className={`tab${mode === 'signup' ? ' on' : ''}`}
              onClick={() => setMode('signup')}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Name – signup only */}
            {mode === 'signup' && (
              <div className="field slide-in">
                <label className="flabel" htmlFor="iname">이름</label>
                <input
                  id="iname"
                  type="text"
                  className={`finput${errs.name ? ' err' : ''}`}
                  placeholder="홍길동"
                  value={name}
                  maxLength={15}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouch((t) => ({ ...t, name: true }))}
                />
                {errs.name && <div className="ferror">⚠ {errs.name}</div>}
              </div>
            )}

            {/* Email */}
            <div className="field">
              <label className="flabel" htmlFor="iemail">이메일</label>
              <input
                id="iemail"
                type="email"
                className={`finput${errs.email ? ' err' : ''}`}
                placeholder="teacher@example.com"
                value={email}
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouch((t) => ({ ...t, email: true }))}
              />
              {errs.email && <div className="ferror">⚠ {errs.email}</div>}
            </div>

            {/* Password */}
            <div className="field">
              <label className="flabel" htmlFor="ipw">비밀번호</label>
              <div className="pw-wrap">
                <input
                  id="ipw"
                  type={showPw ? 'text' : 'password'}
                  className={`finput${errs.pw ? ' err' : ''}`}
                  placeholder={mode === 'signup' ? '6자 이상' : '비밀번호 입력'}
                  value={pw}
                  style={{ paddingRight: '2.5rem' }}
                  onChange={(e) => setPw(e.target.value)}
                  onBlur={() => setTouch((t) => ({ ...t, pw: true }))}
                />
                <button
                  type="button"
                  className="pw-btn"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  <Ico.Eye s={15} off={showPw} />
                </button>
              </div>
              {errs.pw && <div className="ferror">⚠ {errs.pw}</div>}
            </div>

            <button
              type="submit"
              className={`btn-p${ok ? ' success' : ''}`}
              disabled={loading || ok}
            >
              {ok ? (
                <><Ico.Check s={14} /> 완료!</>
              ) : loading ? (
                '처리 중...'
              ) : (
                <>{mode === 'login' ? '로그인' : '회원가입'} <Ico.Arrow s={15} /></>
              )}
            </button>
          </form>

          <button
            className="btn-ghost"
            onClick={() => navigate('/')}
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
