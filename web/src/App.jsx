import { useEffect, useRef, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import UploadScreen from './components/UploadScreen.jsx';
import LectureMode from './components/LectureMode.jsx';

// Java WebServer.java가 listen하는 포트
const WS_URL = 'ws://172.20.10.2:8082';

export default function App() {
  const [view, setView] = useState('start'); // 'start' | 'upload' | 'lecture'
  const [sessionCode, setSessionCode] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [fileName, setFileName] = useState('');

  // WebSocket — 세션이 생긴 동안만 유지. 지금은 "연결 확인용"이라 송신 없음.
  const wsRef = useRef(null);
  const [wsStatus, setWsStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'error' | 'closed'

  useEffect(() => {
    if (!sessionCode) return; // start 화면에서는 연결하지 않음

    setWsStatus('connecting');
    const ws = new WebSocket(WS_URL);
    // 서버가 broadcast하는 바이너리 프레임을 Blob이 아닌 ArrayBuffer로 받음.
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[ws] connected to', WS_URL);
      setWsStatus('connected');
    };
    // 여러 컴포넌트(LectureMode 등)도 같은 ws에 message 리스너를 붙일 수 있도록
    // .onmessage 대신 addEventListener 사용.
    const onMessage = (e) => console.log('[ws] message:', e.data);
    ws.addEventListener('message', onMessage);
    ws.onerror = (err) => {
      console.error('[ws] error', err);
      setWsStatus('error');
    };
    ws.onclose = () => {
      console.log('[ws] closed');
      setWsStatus((s) => (s === 'error' ? 'error' : 'closed'));
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionCode]);

  const handleStart = (code) => {
    setSessionCode(code);
    setView('upload');
  };

  const handleUploaded = ({ data, name }) => {
    setPdfData(data);
    setFileName(name);
    setView('lecture');
  };

  const handleEnd = () => {
    if (!confirm('세션을 종료하시겠습니까?')) return;
    setSessionCode(null); // ← cleanup이 ws.close() 호출
    setPdfData(null);
    setFileName('');
    setView('start');
  };

  if (view === 'start') {
    return <StartScreen onStart={handleStart} />;
  }
  if (view === 'upload') {
    return (
      <UploadScreen
        sessionCode={sessionCode}
        wsRef={wsRef}
        wsStatus={wsStatus}
        onUploaded={handleUploaded}
        onEnd={handleEnd}
      />
    );
  }
  if (view === 'lecture') {
    return (
      <LectureMode
        pdfData={pdfData}
        fileName={fileName}
        sessionCode={sessionCode}
        wsRef={wsRef}
        wsStatus={wsStatus}
        onEnd={handleEnd}
      />
    );
  }
  return null;
}
