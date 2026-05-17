import { useState } from 'react';
import Icon from './Icon.jsx';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  let c = '';
  for (let i = 0; i < 6; i++) c += CHARS[Math.floor(Math.random() * CHARS.length)];
  return c;
}

export default function StartScreen({ onStart }) {
  const [generating, setGenerating] = useState(false);

  const handleStart = () => {
    setGenerating(true);
    const newCode = generateCode();
    setTimeout(() => {
      onStart(newCode);
    }, 600);
  };

  return (
    <div className="start-screen">
      <div className="start-card">
        <h1 className="start-title">
          강의 자료를
          <br />
          실시간으로 함께.
        </h1>
        <p className="start-sub">
          PDF 강의 자료를 업로드하고, 그 위에 직접 필기하며 수업을 진행하세요. 세션 코드를
          생성하면 강의실이 만들어집니다.
        </p>
        <button className="start-cta" onClick={handleStart} disabled={generating}>
          {generating ? (
            <>
              <span
                className="spinner"
                style={{ borderTopColor: 'white', width: 14, height: 14 }}
              />
              세션 생성 중…
            </>
          ) : (
            <>
              새 강의 세션 시작하기
              <Icon name="arrowRight" size={16} />
            </>
          )}
        </button>

        <div className="start-meta">
          <div className="start-meta-item">
            <div className="start-meta-num">01</div>
            <div className="start-meta-text">세션 코드 발급</div>
          </div>
          <div className="start-meta-item">
            <div className="start-meta-num">02</div>
            <div className="start-meta-text">PDF 자료 업로드</div>
          </div>
          <div className="start-meta-item">
            <div className="start-meta-num">03</div>
            <div className="start-meta-text">실시간 필기 강의</div>
          </div>
        </div>
      </div>
    </div>
  );
}
