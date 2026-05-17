import { useEffect, useRef, useState } from 'react';
import { newStrokeId } from '../lib/protocol.js';

// PDF page rendered below + drawing canvas above.
// Strokes are normalized (0–1) so they survive re-renders at any scale.
// 각 stroke에는 64비트 id(BigInt)가 부여되어, 지우개는 stroke 단위로 삭제한다.

function drawStroke(ctx, s, w, h) {
  if (!s.points || s.points.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.thickness;
  ctx.beginPath();
  const first = s.points[0];
  ctx.moveTo(first.x * w, first.y * h);
  if (s.points.length === 1) {
    ctx.lineTo(first.x * w + 0.01, first.y * h + 0.01);
  } else {
    for (let i = 1; i < s.points.length; i++) {
      const p = s.points[i];
      ctx.lineTo(p.x * w, p.y * h);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// 지우개 위치(normalized)와 stroke가 충돌하는지: 점 하나라도 반경 안이면 true.
// 반경도 normalized — 캔버스의 짧은 변 기준 비율.
function strokeHit(stroke, ex, ey, radiusN) {
  const r2 = radiusN * radiusN;
  for (const p of stroke.points) {
    const dx = p.x - ex;
    const dy = p.y - ey;
    if (dx * dx + dy * dy <= r2) return true;
  }
  return false;
}

export default function PageStage({
  pdfDoc,
  pageNum,
  strokes,
  onStrokesChange,
  onEraseStroke,
  tool,
  penColor,
  thickness,
}) {
  const pdfCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawingRef = useRef(null); // 펜으로 그리는 중인 stroke
  const [renderSize, setRenderSize] = useState(null);
  const [rendering, setRendering] = useState(true);

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    setRendering(true);
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const containerEl = containerRef.current?.parentElement;
      const maxW = (containerEl?.clientWidth || 1000) - 40;
      const maxH = (containerEl?.clientHeight || 700) - 40;
      const v1 = page.getViewport({ scale: 1 });
      const scale = Math.min(maxW / v1.width, maxH / v1.height);
      const viewport = page.getViewport({ scale });
      const cssW = Math.floor(viewport.width);
      const cssH = Math.floor(viewport.height);
      const dpr = window.devicePixelRatio || 1;

      const canvas = pdfCanvasRef.current;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTask.promise
        .then(() => {
          if (cancelled) return;
          setRenderSize({ w: cssW, h: cssH, dpr });
          setRendering(false);
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNum]);

  // Repaint strokes when stroke list or size changes
  useEffect(() => {
    if (!renderSize) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const { w, h, dpr } = renderSize;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of strokes) drawStroke(ctx, s, w, h);
  }, [renderSize, strokes]);

  const getNormPoint = (e) => {
    const canvas = drawCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  // 지우개 반경 (normalized) — UI thickness가 클수록 더 크게 닿음.
  const eraserRadiusN = () => {
    if (!renderSize) return 0.01;
    const px = thickness * 4; // 약간 관대하게
    return px / Math.min(renderSize.w, renderSize.h);
  };

  // 현재 위치에서 닿는 모든 stroke를 지운다. 지운 stroke id 배열을 반환.
  const eraseAt = (np) => {
    if (strokes.length === 0) return [];
    const r = eraserRadiusN();
    const erased = [];
    const next = [];
    for (const s of strokes) {
      if (strokeHit(s, np.x, np.y, r)) erased.push(s);
      else next.push(s);
    }
    if (erased.length === 0) return [];
    onStrokesChange(next);
    for (const s of erased) onEraseStroke?.(s.id);
    return erased.map((s) => s.id);
  };

  const handlePointerDown = (e) => {
    if (!renderSize) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = getNormPoint(e);

    if (tool === 'eraser') {
      eraseAt(point);
      drawingRef.current = { eraser: true }; // move에서 계속 지우기 위해 표시
      return;
    }

    const stroke = {
      id: newStrokeId(),
      tool,
      color: penColor,
      thickness,
      points: [point],
    };
    drawingRef.current = stroke;
    const ctx = drawCanvasRef.current.getContext('2d');
    drawStroke(ctx, stroke, renderSize.w, renderSize.h);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    const point = getNormPoint(e);

    if (drawingRef.current.eraser) {
      eraseAt(point);
      return;
    }

    drawingRef.current.points.push(point);
    const ctx = drawCanvasRef.current.getContext('2d');
    const s = drawingRef.current;
    const w = renderSize.w;
    const h = renderSize.h;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.thickness;
    const prev = s.points[s.points.length - 2];
    ctx.beginPath();
    ctx.moveTo(prev.x * w, prev.y * h);
    ctx.lineTo(point.x * w, point.y * h);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    const cur = drawingRef.current;
    drawingRef.current = null;
    if (cur.eraser) return; // 지우개는 이미 move/down에서 처리 완료
    if (cur.points.length >= 1) {
      onStrokesChange([...strokes, cur]);
    }
  };

  return (
    <div
      ref={containerRef}
      className={'page-frame' + (tool === 'eraser' ? ' eraser' : '')}
      style={renderSize ? { width: renderSize.w, height: renderSize.h } : {}}
    >
      <canvas ref={pdfCanvasRef} />
      <canvas
        ref={drawCanvasRef}
        className="draw-layer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {rendering && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.6)',
          }}
        >
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
