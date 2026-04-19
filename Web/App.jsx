// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/globals.css';

import LandingPage      from './pages/LandingPage';
import InstructorPage   from './pages/InstructorPage';
import Dashboard        from './pages/Dashboard';
import InstructorCanvas from './pages/InstructorCanvas';
import CanvasPage       from './pages/CanvasPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 참가자 입장 */}
        <Route path="/"                   element={<LandingPage />} />

        {/* 강사 로그인 / 회원가입 */}
        <Route path="/instructor"         element={<InstructorPage />} />

        {/* 강사 대시보드 */}
        <Route path="/dashboard"          element={<Dashboard />} />

        {/* 강사 캔버스 (드로잉) */}
        <Route path="/instructor-canvas"  element={<InstructorCanvas />} />

        {/* 학생 캔버스 (수신) */}
        <Route path="/canvas"             element={<CanvasPage />} />

        {/* 알 수 없는 경로 → 메인으로 */}
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
