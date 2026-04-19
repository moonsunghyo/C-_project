// src/pages/LandingPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SplitLeft from '../components/SplitLeft';
import { Ico } from '../components/Icons';

export default function LandingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [touch, setTouch] = useState({});

  const errs = {};
  if (touch.code && code.length < 4) errs.code = '세션 코드를 4자 이상 입력해주세요';
  if (touch.name && !name.trim())    errs.name = '이름을 입력해주세요';

  const handleJoin = (e) => {
    e.preventDefault();
    setTouch({ code: true, name: true });
    if (code.length >= 4 && name.trim()) {
      sessionStorage.setItem('adp_sessionCode', code);
      sessionStorage.setItem('adp_name', name);
      navigate('/canvas');
    }
  };

  return (
    <div className="split enter">
      <SplitLeft
        tag="참가자 입장"
        headline="강의실을<br/><span>연결하는</span><br/>화이트보드"
        desc="강사가 개설한 보드에 세션 코드 하나로 즉시 접속. 실시간 드로잉을 함께 확인하세요."
      />

      <div className="split-right">
        <div className="form-box">
          <p className="eyebrow">참가자</p>
          <h1 className="form-title">세션 참가하기</h1>
          <p className="form-sub">
            공유받은 세션 코드와 이름을 입력해 바로 참가할 수 있어요.
          </p>

          <form onSubmit={handleJoin} noValidate>
            <div className="field">
              <label className="flabel" htmlFor="sessionCode">세션 코드</label>
              <input
                id="sessionCode"
                type="text"
                className={`finput code-input${errs.code ? ' err' : ''}`}
                placeholder="AB12CD"
                value={code}
                maxLength={6}
                autoFocus
                onChange={(e) =>
                  setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())
                }
                onBlur={() => setTouch((t) => ({ ...t, code: true }))}
              />
              {errs.code && <div className="ferror">⚠ {errs.code}</div>}
            </div>

            <div className="field">
              <label className="flabel" htmlFor="pname">참가자 이름</label>
              <input
                id="pname"
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

            <button
              type="submit"
              className="btn-p"
              disabled={!code || !name}
            >
              세션 참가하기 <Ico.Arrow s={15} />
            </button>
          </form>

          <div className="divider">또는</div>

          <button
            className="btn-s"
            onClick={() => navigate('/instructor')}
          >
            <Ico.Box s={14} /> 강사로 세션 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
