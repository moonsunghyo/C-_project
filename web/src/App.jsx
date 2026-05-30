import { useEffect, useRef, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import UploadScreen from './components/UploadScreen.jsx';
import LectureMode from './components/LectureMode.jsx';
import Icon from './components/Icon.jsx';

const WS_URL = 'ws://172.20.10.3:8082';

export default function App() {
  const [view, setView] = useState('start'); // 'start' | 'upload' | 'lecture'
  const [isStarted, setIsStarted] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [fileName, setFileName] = useState('');

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const [wsStatus, setWsStatus] = useState('idle');
  const [toast, setToast] = useState(null);

  const showToast = (msg, duration = 3000) => {
    setToast(msg);
    if (duration > 0) {
      setTimeout(() => setToast((t) => (t === msg ? null : t)), duration);
    }
  };

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    console.log('[ws] connecting to', WS_URL);
    setWsStatus('connecting');
    
    const ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[ws] connected');
      setWsStatus('connected');
      showToast('서버에 연결되었습니다.');
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onerror = (err) => {
      console.error('[ws] error:', err);
      setWsStatus('error');
    };

    ws.onclose = () => {
      console.log('[ws] closed');
      wsRef.current = null;
      
      if (isStarted) {
        setWsStatus('closed');
        showToast('서버 연결이 끊겼습니다. 5초 후 재연결을 시도합니다...', 0);
        
        // 5초 후 재연결 시도
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connect();
          }, 5000);
        }
      } else {
        setWsStatus('idle');
      }
    };

    // Global message logger
    ws.onmessage = (e) => {
      // Logic handled in child components via addEventListener
    };
  };

  useEffect(() => {
    if (isStarted) {
      connect();
    } else {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [isStarted]);

  const handleStart = () => {
    setIsStarted(true);
    setView('upload');
  };

  const handleUploaded = ({ data, name }) => {
    setPdfData(data);
    setFileName(name);
    setView('lecture');
  };

  const handleEnd = () => {
    if (!confirm('강의를 종료하시겠습니까?')) return;
    setIsStarted(false);
    setPdfData(null);
    setFileName('');
    setView('start');
    setToast(null);
  };

  return (
    <>
      {view === 'start' && <StartScreen onStart={handleStart} />}
      {view === 'upload' && (
        <UploadScreen
          wsRef={wsRef}
          wsStatus={wsStatus}
          onUploaded={handleUploaded}
          onEnd={handleEnd}
        />
      )}
      {view === 'lecture' && (
        <LectureMode
          pdfData={pdfData}
          fileName={fileName}
          wsRef={wsRef}
          wsStatus={wsStatus}
          onEnd={handleEnd}
        />
      )}

      {toast && (
        <div className="connection-toast">
          {wsStatus === 'connecting' || wsStatus === 'closed' ? (
            <span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} />
          ) : (
            <Icon name={wsStatus === 'connected' ? 'check' : 'alertCircle'} size={16} />
          )}
          {toast}
        </div>
      )}
    </>
  );
}
