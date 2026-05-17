package server;

import org.java_websocket.server.WebSocketServer;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.WebSocket;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class WebServer extends WebSocketServer {

    public WebServer(int port) {
        super(new InetSocketAddress(port));
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        System.out.println("🌐 [웹] 교수님 브라우저 접속!");
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("🌐 [웹] 브라우저 연결 종료");
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        // 텍스트 프레임은 지금 사용 안 함.
    }

    // ★ 바이너리 프레임 — 웹에서 보내는 펜/지우개/PDF가 모두 여기로 들어온다.
    // 포맷(BigEndian):
    //   펜    : int32(1) | int64 strokeId | int32 N | int32 color | int32 size | (float32 x, float32 y) × N
    //   지우개 : int32(0) | int64 strokeId
    //   PDF   : int32(2) | int32 length | bytes × length
    @Override
    public void onMessage(WebSocket conn, ByteBuffer message) {
        message.order(ByteOrder.BIG_ENDIAN);
        if (message.remaining() < 4) {
            System.out.println("⚠️ [웹] 너무 짧은 메시지 (" + message.remaining() + "B)");
            return;
        }
        int type = message.getInt();

        try {
            switch (type) {
                case 1: {
                    long strokeId = message.getLong();
                    int n = message.getInt();
                    int color = message.getInt();
                    int size = message.getInt();
                    // 점은 일단 개수만 확인하고 로그 (이후 broadcast로 확장)
                    int expected = n * 8;
                    int available = message.remaining();
                    System.out.printf(
                        "✏️ [웹] PEN id=%d, N=%d, color=0x%08X, size=%d, payload=%dB (expected %dB)%n",
                        strokeId, n, color, size, available, expected
                    );
                    break;
                }
                case 0: {
                    long strokeId = message.getLong();
                    System.out.printf("🩹 [웹] ERASE id=%d%n", strokeId);
                    break;
                }
                case 2: {
                    int len = message.getInt();
                    System.out.printf("📄 [웹] PDF length=%dB (payload remaining=%dB)%n",
                        len, message.remaining());
                    break;
                }
                default:
                    System.out.println("❓ [웹] 알 수 없는 type=" + type);
            }
        } catch (Exception e) {
            System.out.println("⚠️ [웹] 파싱 실패: " + e.getMessage());
        }
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        ex.printStackTrace();
    }

    @Override
    public void onStart() {
        System.out.println("🚀 웹소켓 서버 가동 중... (Port: 8082)");
    }
}
