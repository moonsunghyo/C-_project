// 웹 → Java WebServer 바이너리 프로토콜.
// 모든 정수/실수는 BigEndian.
// C++ Qt 클라이언트가 TCP로 보내는 포맷과 동일 (type 번호까지 일치).
//
//   펜    : int32(0) | int64 strokeId | int32 pointCount | int32 color | int32 size | (float32 x, float32 y) × N
//   지우개 : int32(1) | int64 strokeId
//   PDF   : int32(2) | int32 byteLength | bytes × byteLength   (웹 전용)
//   페이지 : int32(3) | int32 pageNum                            (웹 전용, 1 ~ n)
//
// 좌표 (x, y)는 0~1 normalized (PageStage 내부 표현 그대로).

export const MSG_PEN = 0;
export const MSG_ERASE = 1;
export const MSG_PDF = 2;
export const MSG_PAGE = 3;

// "#RRGGBB" 또는 "#RRGGBBAA" → int32 (0xAARRGGBB 형태로 통일)
export function colorToInt(hex) {
  if (typeof hex !== 'string') return 0;
  let s = hex.startsWith('#') ? hex.slice(1) : hex;
  if (s.length === 6) s = 'FF' + s;          // alpha 없으면 불투명
  if (s.length !== 8) return 0;
  // parseInt는 부호 처리가 까다로워서 BigInt로 우회
  return Number(BigInt('0x' + s) & 0xffffffffn) | 0;
}

// AARRGGBB 또는 RRGGBB 정수 → CSS rgb 문자열 (서버에서 받은 색을 캔버스에 그리려고 변환)
export function intToColor(n) {
  const u = (n | 0) >>> 0;
  const r = (u >>> 16) & 0xff;
  const g = (u >>> 8) & 0xff;
  const b = u & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}

// 64비트 랜덤 stroke ID (BigInt). Date.now()를 상위 비트로 두고 하위 21비트는 랜덤.
export function newStrokeId() {
  const t = BigInt(Date.now()) & 0x7fffffffffffn; // 안전한 범위로 마스킹
  const r = BigInt(Math.floor(Math.random() * 0x1fffff));
  return (t << 21n) | r;
}

export function encodePen(strokeId, points, color, size) {
  const N = points.length;
  const len = 4 + 8 + 4 + 4 + 4 + N * 8;
  const buf = new ArrayBuffer(len);
  const v = new DataView(buf);
  let off = 0;
  v.setInt32(off, MSG_PEN, false); off += 4;
  // Number / BigInt 둘 다 허용 (서버에서 받은 JSON id는 Number, 로컬 생성은 BigInt)
  v.setBigInt64(off, BigInt.asIntN(64, BigInt(strokeId)), false); off += 8;
  v.setInt32(off, N, false); off += 4;
  v.setInt32(off, color | 0, false); off += 4;
  v.setInt32(off, size | 0, false); off += 4;
  for (const p of points) {
    v.setFloat32(off, p.x, false); off += 4;
    v.setFloat32(off, p.y, false); off += 4;
  }
  return buf;
}

export function encodeErase(strokeId) {
  const buf = new ArrayBuffer(4 + 8);
  const v = new DataView(buf);
  v.setInt32(0, MSG_ERASE, false);
  v.setBigInt64(4, BigInt.asIntN(64, BigInt(strokeId)), false);
  return buf;
}

// 서버가 broadcast하는 바이너리 패킷을 디코드.
// 송신 포맷과 완전히 동일한 레이아웃이므로 encodePen/encodeErase의 역연산.
// 반환: { type:'pen', id:BigInt, color:int, size:int, points:[{x,y},...] }
//      | { type:'erase', id:BigInt }
//      | null  (알 수 없는 type)
export function decodeMessage(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer)) return null;
  if (arrayBuffer.byteLength < 4) return null;
  const v = new DataView(arrayBuffer);
  let off = 0;
  const type = v.getInt32(off, false); off += 4;

  if (type === MSG_PEN) {
    if (arrayBuffer.byteLength < 4 + 8 + 4 + 4 + 4) return null;
    const id = v.getBigInt64(off, false); off += 8;
    const n = v.getInt32(off, false); off += 4;
    const color = v.getInt32(off, false); off += 4;
    const size = v.getInt32(off, false); off += 4;
    if (arrayBuffer.byteLength < off + n * 8) return null;
    const points = new Array(n);
    for (let i = 0; i < n; i++) {
      const x = v.getFloat32(off, false); off += 4;
      const y = v.getFloat32(off, false); off += 4;
      points[i] = { x, y };
    }
    return { type: 'pen', id, color, size, points };
  }
  if (type === MSG_ERASE) {
    if (arrayBuffer.byteLength < 4 + 8) return null;
    const id = v.getBigInt64(off, false);
    return { type: 'erase', id };
  }
  return null;
}

// 페이지 번호 송신: int32(3) | int32 pageNum
export function encodePage(pageNum) {
  const buf = new ArrayBuffer(8);
  const v = new DataView(buf);
  v.setInt32(0, MSG_PAGE, false);
  v.setInt32(4, pageNum | 0, false);
  return buf;
}

export function encodePdf(uint8) {
  const len = 4 + 4 + uint8.byteLength;
  const buf = new ArrayBuffer(len);
  const v = new DataView(buf);
  v.setInt32(0, MSG_PDF, false);
  v.setInt32(4, uint8.byteLength, false);
  new Uint8Array(buf, 8).set(uint8);
  return buf;
}

// 안전한 송신 헬퍼: ws가 OPEN일 때만 보냄.
export function safeSend(ws, payload) {
  if (!ws) return false;
  if (ws.readyState !== WebSocket.OPEN) return false;
  ws.send(payload);
  return true;
}
