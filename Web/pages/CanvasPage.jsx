import React, { useEffect, useRef, useState } from 'react';

export default function CanvasPage() {
  const canvasRef = useRef(null);
  const [infoText, setInfoText] = useState("서버 연결 대기 중...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let lastX = null;
    let lastY = null;
    let lastTime = Date.now();

    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const socket = new WebSocket('ws://localhost:8082');

    socket.onopen = () => {
      setInfoText("🟢 서버 연결 성공! 데이터를 기다리는 중...");
      console.log("Connected to Java WebSocket Server");
    };

    socket.onmessage = (event) => {
      const data = event.data.split(',');
      const relX = parseFloat(data[0]);
      const relY = parseFloat(data[1]);
      const colorIdx = parseInt(data[2]);

      const x = relX * canvas.width;
      const y = relY * canvas.height;

      // 0.1초(100ms) 이상 데이터가 끊겼다가 다시 오면 '새로운 선'으로 인식함
      const currentTime = Date.now();
      if (currentTime - lastTime > 100) {
        lastX = null;
        lastY = null;
      }
      lastTime = currentTime;

      // 색상 선택
      ctx.strokeStyle = (colorIdx === 0) ? "black" : "red";

      // 핵심 수정: 점이 아닌 선 긋기
      if (lastX !== null && lastY !== null) {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }

      lastX = x;
      lastY = y;

      setInfoText(`수신 중: X(${x.toFixed(1)}), Y(${y.toFixed(1)})`);
    };

    socket.onerror = (error) => {
      setInfoText("🔴 연결 에러 발생!");
      console.error(error);
    };

    socket.onclose = () => {
      setInfoText("⚪ 서버와 연결이 끊겼습니다.");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#2c3e50',
      color: 'white',
      fontFamily: 'sans-serif',
      minHeight: '100vh',
      paddingTop: '20px'
    }}>
      <h1>실시간 캔버스 (교수님 화면)</h1>
      <canvas 
        ref={canvasRef} 
        width="800" 
        height="600"
        style={{
          background: 'white',
          border: '5px solid #34495e',
          cursor: 'default',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)'
        }}
      ></canvas>
      <div style={{
        marginTop: '15px',
        fontSize: '1.2em',
        color: '#ecf0f1'
      }}>
        {infoText}
      </div>
    </div>
  );
}
