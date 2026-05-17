// 작은 WebSocket 연결 상태 인디케이터 (상단바용)
const COLORS = {
  idle: '#9B9A97',
  connecting: '#D4A93A',
  connected: '#22A06B',
  error: '#E03E00',
  closed: '#9B9A97',
};
const LABELS = {
  idle: '대기',
  connecting: '연결 중',
  connected: '연결됨',
  error: '연결 실패',
  closed: '끊김',
};

export default function WsStatus({ status }) {
  const color = COLORS[status] || COLORS.idle;
  return (
    <span
      title={`서버: ${LABELS[status] || status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: '#FAFAF9',
        border: '1px solid #EAE9E5',
        fontSize: 12,
        color: '#37352F',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: status === 'connecting' ? `0 0 0 4px ${color}22` : 'none',
        }}
      />
      서버 {LABELS[status] || status}
    </span>
  );
}
