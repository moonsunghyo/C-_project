import { useEffect, useRef, useState } from 'react';

function Thumb({ pdfDoc, pageNum, active, hasAnnotations, onClick }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const targetW = 200;
      const v1 = page.getViewport({ scale: 1 });
      const scale = targetW / v1.width;
      const viewport = page.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      page
        .render({ canvasContext: ctx, viewport })
        .promise.then(() => {
          if (!cancelled) setLoaded(true);
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNum]);

  return (
    <div className={'thumb-item' + (active ? ' active' : '')} onClick={onClick}>
      <div className="thumb-num">{pageNum}</div>
      <div className="thumb-canvas-wrap">
        {!loaded && <div className="thumb-skeleton" />}
        <canvas ref={canvasRef} style={{ display: loaded ? 'block' : 'none' }} />
      </div>
      {hasAnnotations && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 0 2px white',
          }}
        />
      )}
    </div>
  );
}

export default function ThumbList({ pdfDoc, pageCount, currentPage, annotated, onSelect }) {
  return (
    <div className="thumb-list">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <Thumb
          key={n}
          pdfDoc={pdfDoc}
          pageNum={n}
          active={n === currentPage}
          hasAnnotations={annotated.has(n)}
          onClick={() => onSelect(n)}
        />
      ))}
    </div>
  );
}
