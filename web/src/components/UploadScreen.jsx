import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import WsStatus from './WsStatus.jsx';
import { encodePdf, safeSend } from '../lib/protocol.js';

export default function UploadScreen({ wsRef, wsStatus, onUploaded, onEnd }) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null); // { name, size, pct }
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    const sizeKB = (file.size / 1024).toFixed(0);
    setProgress({ name: file.name, size: sizeKB, pct: 0 });

    let pct = 0;
    const tick = setInterval(() => {
      pct = Math.min(pct + Math.random() * 18 + 6, 95);
      setProgress((p) => p && { ...p, pct });
    }, 120);

    const reader = new FileReader();
    reader.onload = (e) => {
      clearInterval(tick);
      setProgress((p) => p && { ...p, pct: 100 });
      const data = new Uint8Array(e.target.result);
      console.log(`[Upload] File read complete. Size: ${data.byteLength} bytes`);
      
      if (data.byteLength === 0) {
        alert('파일이 비어있습니다.');
        return;
      }

      // 서버로 PDF 전체 전송 (type=2 | length | bytes)
      const sent = safeSend(wsRef?.current, encodePdf(data));
      console.log('[ws] pdf send:', sent ? 'ok' : 'ws not open');
      
      console.log('[Upload] Triggering onUploaded callback');
      setTimeout(() => onUploaded({ data, name: file.name }), 350);
    };
    reader.onerror = () => {
      clearInterval(tick);
      setProgress(null);
      alert('파일 읽기에 실패했습니다.');
    };
    reader.readAsArrayBuffer(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="upload-screen">
      <div className="upload-topbar">
        <div className="upload-topbar-left">
          <div className="upload-topbar-logo">L</div>
          <span>강의 세션이 열렸습니다</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WsStatus status={wsStatus} />
          <button className="end-btn" onClick={onEnd}>
            <Icon name="logout" size={12} stroke={1.8} />
            종료
          </button>
        </div>
      </div>

      <div className="upload-body">
        <div className="upload-content">
          <div className="upload-heading">
            <h2>강의 자료를 업로드해주세요</h2>
            <p>PDF 파일을 드래그하거나 직접 선택할 수 있습니다.</p>
          </div>

          <div
            className={'dropzone' + (dragging ? ' dragging' : '')}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="dropzone-icon">
              <Icon name="upload" size={26} stroke={1.5} />
            </div>
            <div className="dropzone-title">
              {dragging ? '여기에 놓으세요' : 'PDF를 끌어다 놓거나 클릭하세요'}
            </div>
            <div className="dropzone-sub">최대 100MB · .pdf</div>
            <button
              className="dropzone-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              파일 선택
            </button>
          </div>

          {progress && (
            <div className="upload-progress">
              <div className="upload-progress-icon">
                <Icon name="file" size={18} stroke={1.6} />
              </div>
              <div className="upload-progress-body">
                <div className="upload-progress-name">{progress.name}</div>
                <div className="upload-progress-bar">
                  <div
                    className="upload-progress-bar-fill"
                    style={{ width: progress.pct + '%' }}
                  />
                </div>
                <div className="upload-progress-meta">
                  {Math.round(progress.pct)}% · {progress.size}KB
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
