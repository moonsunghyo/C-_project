import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { pdfjsLib, CDN_WORKER } from '../lib/pdf.js';
import Icon from './Icon.jsx';
import ThumbList from './ThumbList.jsx';
import PageStage from './PageStage.jsx';
import Toolbar from './Toolbar.jsx';
import WsStatus from './WsStatus.jsx';
import ParticipantList from './ParticipantList.jsx';
import {
  colorToInt,
  decodeMessage,
  encodeErase,
  encodePage,
  encodePen,
  intToColor,
  safeSend,
} from '../lib/protocol.js';

const DEFAULT_PEN_COLOR = '#E03E00';

export default function LectureMode({
  pdfData,
  fileName,
  wsRef,
  wsStatus,
  onEnd,
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const currentPageRef = useRef(1);

  // Sync ref with state for use in event listeners
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const [loadError, setLoadError] = useState(null);

  // strokes per page: { [pageNum]: stroke[] }
  const [strokesByPage, setStrokesByPage] = useState({});
  // undo / redo stacks per page (refs — no rerender needed when pushing)
  const undoRef = useRef({});
  const redoRef = useRef({});
  const [, forceRerender] = useReducer((x) => x + 1, 0);

  const [tool, setTool] = useState('pen');
  const [thickness, setThickness] = useState(3);
  const [penColor, setPenColor] = useState(DEFAULT_PEN_COLOR);
  const [participants, setParticipants] = useState([]);

  const [toast, setToast] = useState(null);

  // Load PDF whenever pdfData changes
  useEffect(() => {
    if (!pdfData) {
      console.warn('[pdf] No pdfData provided');
      return;
    }
    
    setLoadError(null);
    let cancelled = false;
    let loadedDoc = null;

    const loadWithWorker = (workerSrc) => {
      if (workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      }
      
      // pdfData가 ArrayBuffer인 경우 직접 slice, Uint8Array인 경우 buffer를 slice
      const buffer = pdfData instanceof ArrayBuffer ? pdfData : pdfData.buffer;
      const dataCopy = buffer.slice(0);
      
      console.log(`[pdf] attempting load with worker: ${workerSrc || 'default'}, size: ${dataCopy.byteLength}`);
      
      const task = pdfjsLib.getDocument({ 
        data: dataCopy,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });

      return task.promise
        .then((doc) => {
          console.log('[pdf] loaded successfully:', doc.numPages, 'pages');
          if (cancelled) {
            doc.destroy();
            return;
          }
          loadedDoc = doc;
          setPdfDoc(doc);
          setPageCount(doc.numPages);
          setCurrentPage(1);
        });
    };

    loadWithWorker().catch((err) => {
      console.warn('[pdf] local worker failed, trying CDN...', err);
      if (cancelled) return;
      
      // 로컬 워커 실패 시 CDN 워커로 재시도
      loadWithWorker(CDN_WORKER).catch((err2) => {
        if (cancelled) return;
        console.error('[pdf] all load attempts failed:', err2);
        setLoadError(
          'PDF를 불러올 수 없습니다. 파일 형식을 확인하거나 나중에 다시 시도해주세요. (' + (err2?.message || String(err2)) + ')'
        );
      });
    });

    return () => {
      cancelled = true;
      if (loadedDoc) loadedDoc.destroy();
    };
  }, [pdfData, fileName]);

  // 서버가 broadcast하는 바이너리 프레임을 받아서 캔버스에 반영.
  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws) return;

    const onMessage = (event) => {
      if (!(event.data instanceof ArrayBuffer)) return;
      const msg = decodeMessage(event.data);
      if (!msg) return;

      if (msg.type === 'pen') {
        const stroke = {
          id: msg.id,
          color: intToColor(msg.color),
          thickness: msg.size,
          points: msg.points,
          author: msg.author || '학생',
        };
        setStrokesByPage((s) => ({
          ...s,
          [currentPageRef.current]: [...(s[currentPageRef.current] || []), stroke],
        }));
      } else if (msg.type === 'erase') {
        setStrokesByPage((s) => {
          const next = {};
          for (const k of Object.keys(s)) {
            next[k] = s[k].filter((stk) => stk.id !== msg.id);
          }
          return next;
        });
      } else if (msg.type === 'users') {
        setParticipants(msg.users);
      }
    };

    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [wsRef, wsStatus]);

  // 페이지 이동 시 서버에 알림
  const lastSentPageRef = useRef(null);
  useEffect(() => {
    if (!pageCount) return;

    if (lastSentPageRef.current === null) {
      lastSentPageRef.current = currentPage;
      return;
    }
    if (lastSentPageRef.current === currentPage) return;

    const ok = safeSend(wsRef?.current, encodePage(currentPage));
    if (ok) lastSentPageRef.current = currentPage;
  }, [currentPage, pageCount, wsStatus, wsRef]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const strokes = strokesByPage[currentPage] || [];

  const handleStrokesChange = (next) => {
    const stack = undoRef.current[currentPage] || [];
    undoRef.current[currentPage] = [...stack, strokes];
    redoRef.current[currentPage] = [];
    
    // 강사가 그린 선에 작성자 정보 명시
    const nextWithAuthor = next.map(s => s.author ? s : { ...s, author: '강사' });
    setStrokesByPage((s) => ({ ...s, [currentPage]: nextWithAuthor }));

    if (next.length > strokes.length) {
      const added = next[next.length - 1];
      if (added && !added.eraser) {
        safeSend(
          wsRef?.current,
          encodePen(
            currentPage,
            added.id,
            added.points,
            colorToInt(added.color),
            added.thickness
          )
        );
      }
    }
  };

  const handleEraseStroke = (strokeId) => {
    safeSend(wsRef?.current, encodeErase(currentPage, strokeId));
  };

  const undo = () => {
    const stack = undoRef.current[currentPage] || [];
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    undoRef.current[currentPage] = stack.slice(0, -1);
    redoRef.current[currentPage] = [...(redoRef.current[currentPage] || []), strokes];
    setStrokesByPage((s) => ({ ...s, [currentPage]: prev }));
    forceRerender();
  };

  const redo = () => {
    const stack = redoRef.current[currentPage] || [];
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    redoRef.current[currentPage] = stack.slice(0, -1);
    undoRef.current[currentPage] = [...(undoRef.current[currentPage] || []), strokes];
    setStrokesByPage((s) => ({ ...s, [currentPage]: next }));
    forceRerender();
  };

  const clearPage = () => {
    if (strokes.length === 0) return;
    undoRef.current[currentPage] = [...(undoRef.current[currentPage] || []), strokes];
    redoRef.current[currentPage] = [];
    setStrokesByPage((s) => ({ ...s, [currentPage]: [] }));
    showToast('현재 페이지의 필기를 모두 지웠습니다');
  };

  useEffect(() => {
    const handler = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'ArrowLeft' && !e.target.matches('input,textarea')) {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight' && !e.target.matches('input,textarea')) {
        setCurrentPage((p) => Math.min(pageCount, p + 1));
      } else if (e.key.toLowerCase() === 'p') {
        setTool('pen');
      } else if (e.key.toLowerCase() === 'e') {
        setTool('eraser');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [strokes, pageCount]);

  const annotated = useMemo(() => {
    const set = new Set();
    Object.entries(strokesByPage).forEach(([p, ss]) => {
      if (ss && ss.length > 0) set.add(Number(p));
    });
    return set;
  }, [strokesByPage]);

  const canUndo = (undoRef.current[currentPage] || []).length > 0;
  const canRedo = (redoRef.current[currentPage] || []).length > 0;

  return (
    <div className="lecture">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">{fileName}</div>
          <div className="sidebar-sub">
            {pageCount}페이지 · {annotated.size}장 필기됨
          </div>
        </div>
        {pdfDoc && (
          <ThumbList
            pdfDoc={pdfDoc}
            pageCount={pageCount}
            currentPage={currentPage}
            annotated={annotated}
            onSelect={setCurrentPage}
          />
        )}
      </aside>

      <main className="stage">
        <div className="stage-topbar">
          <div className="stage-doc-name">
            <Icon name="file" size={14} stroke={1.6} />
            <span className="stage-doc-name-text">강의 진행 중</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <WsStatus status={wsStatus} />
            <button className="end-btn" onClick={onEnd}>
              <Icon name="logout" size={12} stroke={1.8} />
              강의 종료
            </button>
          </div>
        </div>

        <div className="stage-canvas-area">
          {loadError ? (
            <div className="stage-empty">
              <Icon name="alertCircle" size={48} stroke={1.5} color="var(--accent)" />
              <div style={{ marginTop: 16 }}>{loadError}</div>
              <button className="end-btn" style={{ marginTop: 24 }} onClick={onEnd}>돌아가기</button>
            </div>
          ) : !pdfDoc ? (
            <div className="stage-empty">
              <div className="spinner" />
              <div style={{ fontSize: 13, marginTop: 12 }}>PDF 문서를 처리하는 중입니다…</div>
            </div>
          ) : (
            <PageStage
              key={currentPage}
              pdfDoc={pdfDoc}
              pageNum={currentPage}
              strokes={strokes}
              onStrokesChange={handleStrokesChange}
              onEraseStroke={handleEraseStroke}
              tool={tool}
              penColor={penColor}
              thickness={thickness}
            />
          )}
        </div>

        {pdfDoc && (
          <>
            <Toolbar
              tool={tool}
              setTool={setTool}
              thickness={thickness}
              setThickness={setThickness}
              penColor={penColor}
              setPenColor={setPenColor}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onClearPage={clearPage}
            />
            <div className="page-nav">
              <button
                className="page-nav-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              <div className="page-nav-info">
                {currentPage} / {pageCount}
              </div>
              <button
                className="page-nav-btn"
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
              >
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </>
        )}
      </main>

      <ParticipantList participants={participants} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
 className="toast">{toast}</div>}
    </div>
  );
}
