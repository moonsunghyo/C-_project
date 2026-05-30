// 웹 → Java WebServer 바이너리 프로토콜.
// 모든 정수/실수는 BigEndian.
// C++ Qt 클라이언트가 TCP로 보내는 포맷과 동일 (type 번호까지 일치).
//
//   펜    : int32(0) | int32 pageNum | int64 strokeId | int32 pointCount | int32 color | int32 size | (float32 x, float32 y) × N
//   지우개 : int32(1) | int32 pageNum | int64 strokeId
//   PDF   : int32(2) | int32 byteLength | bytes × byteLength   (웹 전용)
//   페이지 : int32(3) | int32 pageNum                            (웹 전용, 1 ~ n)

export const MSG_PEN = 0;
export const MSG_ERASE = 1;
export const MSG_PDF = 2;
export const MSG_PAGE = 3;
export const MSG_USERS = 4;

// ... (colorToInt, intToColor, newStrokeId functions stay the same)

export function encodePen(pageNum, strokeId, points, color, size) {
  const N = points.length;
  const len = 4 + 4 + 8 + 4 + 4 + 4 + N * 8;
  const buf = new ArrayBuffer(len);
  const v = new DataView(buf);
  let off = 0;
  v.setInt32(off, MSG_PEN, false); off += 4;
  v.setInt32(off, pageNum | 0, false); off += 4;
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

export function encodeErase(pageNum, strokeId) {
  const buf = new ArrayBuffer(4 + 4 + 8);
  const v = new DataView(buf);
  v.setInt32(0, MSG_ERASE, false);
  v.setInt32(4, pageNum | 0, false);
  v.setBigInt64(8, BigInt.asIntN(64, BigInt(strokeId)), false);
  return buf;
}

export function decodeMessage(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer)) return null;
  if (arrayBuffer.byteLength < 4) return null;
  const v = new DataView(arrayBuffer);
  let off = 0;
  const type = v.getInt32(off, false); off += 4;

  if (type === MSG_PEN) {
    const pageNum = v.getInt32(off, false); off += 4;
    const id = v.getBigInt64(off, false); off += 8;
    const n = v.getInt32(off, false); off += 4;
    const color = v.getInt32(off, false); off += 4;
    const size = v.getInt32(off, false); off += 4;
    const points = new Array(n);
    for (let i = 0; i < n; i++) {
      const x = v.getFloat32(off, false); off += 4;
      const y = v.getFloat32(off, false); off += 4;
      points[i] = { x, y };
    }

    let author = '알 수 없음';
    if (arrayBuffer.byteLength >= off + 4) {
      const idLen = v.getInt32(off, false); off += 4;
      if (idLen > 0 && arrayBuffer.byteLength >= off + idLen) {
        const idBytes = new Uint8Array(arrayBuffer, off, idLen);
        author = new TextDecoder().decode(idBytes);
      } else if (idLen === 0) author = '강사';
    } else {
      author = '강사';
    }

    return { type: 'pen', pageNum, id, color, size, points, author };
  }
  if (type === MSG_ERASE) {
    const pageNum = v.getInt32(off, false); off += 4;
    const id = v.getBigInt64(off, false);
    return { type: 'erase', pageNum, id };
  }
  if (type === MSG_USERS) {
    const count = v.getInt32(off, false); off += 4;
    const userList = [];
    const decoder = new TextDecoder();
    for (let i = 0; i < count; i++) {
      const len = v.getInt32(off, false); off += 4;
      const nameBytes = new Uint8Array(arrayBuffer, off, len); off += len;
      userList.push(decoder.decode(nameBytes));
    }
    return { type: 'users', users: userList };
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
