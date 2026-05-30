import { useState } from 'react';
import Icon from './Icon.jsx';

export default function StartScreen({ onStart }) {
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      onStart();
    }, 400);
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
          PDF 강의 자료를 업로드하고, 그 위에 직접 필기하며 수업을 진행하세요. 
          실시간으로 모든 학생들과 강의 화면을 공유할 수 있습니다.
        </p>
        <button className="start-cta" onClick={handleStart} disabled={loading}>
          {loading ? (
            <>
              <span
                className="spinner"
                style={{ borderTopColor: 'white', width: 14, height: 14 }}
              />
              강의실 준비 중…
            </>
          ) : (
            <>
              강의 시작하기
              <Icon name="arrowRight" size={16} />
            </>
          )}
        </button>

        <div className="start-meta">
          <div className="start-meta-item">
            <div className="start-meta-num">01</div>
            <div className="start-meta-text">강의 시작</div>
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
