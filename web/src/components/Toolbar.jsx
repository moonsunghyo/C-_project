import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const PRESETS = [2, 4, 8, 14];
const COLOR_PRESETS = [
  '#1F1F1F', // 검정
  '#E03E00', // 빨강
  '#F59E0B', // 주황
  '#22A06B', // 초록
  '#1A73E8', // 파랑
  '#7C3AED', // 보라
];

export default function Toolbar({
  tool,
  setTool,
  thickness,
  setThickness,
  penColor,
  setPenColor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearPage,
}) {
  const [showThickness, setShowThickness] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const thicknessRef = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    if (!showThickness) return;
    const onDown = (e) => {
      if (thicknessRef.current && !thicknessRef.current.contains(e.target)) {
        setShowThickness(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showThickness]);

  useEffect(() => {
    if (!showColor) return;
    const onDown = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) {
        setShowColor(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showColor]);

  const previewSize = Math.max(4, Math.min(28, thickness + 2));
  const eqColor = (a, b) =>
    (a || '').toLowerCase() === (b || '').toLowerCase();

  return (
    <div className="toolbar" onPointerDown={(e) => e.stopPropagation()}>
      <button
        className={'tool-btn' + (tool === 'pen' ? ' active' : '')}
        onClick={() => setTool('pen')}
        title="펜"
      >
        <Icon name="pen" />
      </button>
      <button
        className={'tool-btn' + (tool === 'eraser' ? ' active' : '')}
        onClick={() => setTool('eraser')}
        title="지우개"
      >
        <Icon name="eraser" />
      </button>

      <div className="tool-divider" />

      <div className="tool-color" ref={colorRef}>
        <button
          className="tool-btn"
          onClick={() => setShowColor((s) => !s)}
          title="색"
        >
          <span
            className="color-swatch"
            style={{ width: 16, height: 16, background: penColor }}
          />
        </button>
        {showColor && (
          <div className="color-pop">
            <div className="color-presets">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={
                    'color-preset' + (eqColor(c, penColor) ? ' active' : '')
                  }
                  style={{ background: c }}
                  onClick={() => {
                    setPenColor(c);
                    setShowColor(false);
                  }}
                  title={c}
                />
              ))}
            </div>
            <input
              type="color"
              className="color-custom"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="tool-divider" />

      <div className="tool-thickness" ref={thicknessRef}>
        <button
          className="tool-btn"
          onClick={() => setShowThickness((s) => !s)}
          title="굵기"
        >
          <span
            style={{
              display: 'inline-block',
              width: Math.min(thickness + 2, 16),
              height: Math.min(thickness + 2, 16),
              background: 'currentColor',
              borderRadius: '50%',
            }}
          />
        </button>
        {showThickness && (
          <div className="thickness-pop">
            <div className="thickness-preview">
              <div
                className="thickness-preview-dot"
                style={{ width: previewSize, height: previewSize }}
              />
            </div>
            <div className="thickness-row">
              <input
                className="thickness-slider"
                type="range"
                min="1"
                max="24"
                step="1"
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
              />
              <span className="thickness-value">{thickness}px</span>
            </div>
            <div className="thickness-presets">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  className={'thickness-preset' + (p === thickness ? ' active' : '')}
                  onClick={() => setThickness(p)}
                >
                  <span
                    className="dot"
                    style={{ width: Math.min(p + 2, 16), height: Math.min(p + 2, 16) }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tool-divider" />

      <button className="tool-btn" onClick={onUndo} disabled={!canUndo} title="실행 취소 (⌘Z)">
        <Icon name="undo" />
      </button>
      <button className="tool-btn" onClick={onRedo} disabled={!canRedo} title="다시 실행 (⌘⇧Z)">
        <Icon name="redo" />
      </button>

      <div className="tool-divider" />

      <button className="tool-btn" onClick={onClearPage} title="이 페이지 지우기">
        <Icon name="trash" />
      </button>
    </div>
  );
}
