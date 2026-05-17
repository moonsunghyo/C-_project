import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { pdfjsLib } from '../lib/pdf.js';
import Icon from './Icon.jsx';
import ThumbList from './ThumbList.jsx';
import PageStage from './PageStage.jsx';
import Toolbar from './Toolbar.jsx';
import WsStatus from './WsStatus.jsx';
import {
  colorToInt,
  decodeMessage,
  encodeErase,
  encodePen,
  intToColor,
  safeSend,
} from '../lib/protocol.js';

const PEN_COLOR = '#E03E00';

export default function LectureMode({
  pdfData,
  fileName,
  sessionCode,
  wsRef,
  wsStatus,
  onEnd,
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState(null);

  // strokes per page: { [pageNum]: stroke[] }
  const [strokesByPage, setStrokesByPage] = useState({});
  // undo / redo stacks per page (refs — no rerender needed when pushing)
  const undoRef = useRef({});
  const redoRef = useRef({});
  const [, forceRerender] = useReducer((x) => x + 1, 0);

  const [tool, setTool] = useState('pen');
  const [thickness, setThickness] = useState(3);

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  // Load PDF whenever pdfData changes
  // 주의: pdfjs는 worker를 전역적으로 공유한다. 그래서 cleanup에서 loading task를
  // 곧장 destroy하면 React StrictMode의 effect 더블 실행 때 worker가 죽어버려서
  // "Error: Worker was destroyed"가 나며 두 번째 시도가 실패한다.
  // 또 pdfjs가 typed array의 underlying buffer를 worker로 transfer해버리는
  // 경우가 있어, 같은 pdfData를 다시 넘기면 detached가 될 수 있다.
  // → 매번 buffer를 복제해서 전달하고, cleanup은 cancel 플래그로만 처리한다.
  useEffect(() => {
    if (!pdfData) return;
    setLoadError(null);
    let cancelled = false;
    let loadedDoc = null;

    const dataCopy = pdfData.slice(); // ArrayBuffer transfer 방지용 복제
    const task = pdfjsLib.getDocument({ data: dataCopy });
    task.promise
      .then((doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        loadedDoc = doc;
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        setCurrentPage(1);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('PDF load error:', err);
        setLoadError(
          'PDF를 불러올 수 없습니다: ' + (err?.message || String(err))
        );
      });

    return () => {
      cancelled = true;
      // 이미 로드된 문서만 안전하게 정리. loading task 자체는 destroy하지 않는다.
      if (loadedDoc) loadedDoc.destroy();
    };
  }, [pdfData]);

  // 서버가 broadcast하는 바이너리 프레임을 받아서 캔버스에 반영.
  // 송신과 완전히 동일한 포맷 (encodePen / encodeErase의 역).
  //   pen   → 현재 페이지에 stroke 추가 (page 정보가 패킷에 없어서 현재 페이지에 그림)
  //   erase → 해당 id stroke를 모든 페이지에서 제거
  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws) return;

    const onMessage = (event) => {
      if (!(event.data instanceof ArrayBuffer)) return; // 텍스트는 무시
      const msg = decodeMessage(event.data);
      if (!msg) return;

      if (msg.type === 'pen') {
        const stroke = {
          id: msg.id, // BigInt
          color: intToColor(msg.color),
          thickness: msg.size,
          points: msg.points,
        };
        setStrokesByPage((s) => ({
          ...s,
          [currentPage]: [...(s[currentPage] || []), stroke],
        }));
      } else if (msg.type === 'erase') {
        setStrokesByPage((s) => {
          const next = {};
          for (const k of Object.keys(s)) {
            next[k] = s[k].filter((stk) => stk.id !== msg.id);
          }
          return next;
        });
      }
    };

    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [wsRef, wsStatus, currentPage]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    showToast('세션 코드가 복사되었습니다');
  };

  const strokes = strokesByPage[currentPage] || [];

  const handleStrokesChange = (next) => {
    const stack = undoRef.current[currentPage] || [];
    undoRef.current[currentPage] = [...stack, strokes];
    redoRef.current[currentPage] = [];
    setStrokesByPage((s) => ({ ...s, [currentPage]: next }));

    // 새로 추가된 stroke만 골라 서버로 송신 (지우개는 PageStage가 onEraseStroke로 따로 알려줌)
    if (next.length > strokes.length) {
      const added = next[next.length - 1];
      if (added && !added.eraser) {
        const ok = safeSend(
          wsRef?.current,
          encodePen(
            added.id,
            added.points,
            colorToInt(added.color),
            added.thickness
          )
        );
        console.log('[ws] pen send:', ok ? 'ok' : 'ws not open');
      }
    }
  };

  // 지우개로 stroke 하나가 사라질 때마다 호출됨 (PageStage → 여기)
  const handleEraseStroke = (strokeId) => {
    const ok = safeSend(wsRef?.current, encodeErase(strokeId));
    console.log('[ws] erase send:', ok ? 'ok' : 'ws not open');
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

  // Keyboard shortcuts
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="session-chip">
              <span className="session-chip-label">코드</span>
              <span className="session-chip-code">{sessionCode}</span>
              <button className="session-chip-copy" onClick={copyCode}>
                <Icon name={copied ? 'check' : 'copy'} size={14} stroke={1.8} />
              </button>
            </div>
            <button className="end-btn" onClick={onEnd}>
              <Icon name="logout" size={12} stroke={1.8} />
              세션 종료
            </button>
          </div>
        </div>

        <div className="stage-canvas-area">
          {loadError ? (
            <div className="stage-empty">{loadError}</div>
          ) : !pdfDoc ? (
            <div className="stage-empty">
              <div className="spinner" />
              <div style={{ fontSize: 13 }}>PDF 불러오는 중…</div>
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
              penColor={PEN_COLOR}
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
