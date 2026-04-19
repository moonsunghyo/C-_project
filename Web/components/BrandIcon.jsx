// src/components/BrandIcon.jsx
import { Ico } from './Icons';

export default function BrandIcon({ size = 28 }) {
  return (
    <div
      className="brand-icon"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.27) }}
    >
      <Ico.Box s={Math.round(size * 0.55)} />
    </div>
  );
}
