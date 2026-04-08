package server;

import org.java_websocket.server.WebSocketServer;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.WebSocket;
import java.net.InetSocketAddress;

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
        // 브라우저에서 서버로 보낼 메시지는 없으므로 비워둡니다.
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
