package server;

import org.java_websocket.server.WebSocketServer;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.WebSocket;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class WebServer extends WebSocketServer {

    // 메시지 타입 (C++ TCP / 웹 모두 동일)
    private static final int MSG_PEN   = 0;
    private static final int MSG_ERASE = 1;
    private static final int MSG_PDF   = 2;
    private static final int MSG_PAGE  = 3;  // 웹 전용: 페이지 번호
    private static final int MSG_USERS = 4;  // 접속 인원 목록

    public WebServer(int port) {
        super(new InetSocketAddress(port));
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        System.out.println("🌐 [웹] 교수님 브라우저 접속!");
        // 접속 시 현재 인원 목록 즉시 전송
        MainServer.broadcastUserList();
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("🌐 [웹] 브라우저 연결 종료");
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        // 텍스트 프레임은 지금 사용 안 함.
    }

    // ★ 바이너리 프레임 — 웹에서 보내는 펜/지우개/PDF/페이지가 모두 여기로 들어온다.
    @Override
    public void onMessage(WebSocket conn, ByteBuffer message) {
        message.order(ByteOrder.BIG_ENDIAN);
        byte[] packet = new byte[message.remaining()];
        message.mark(); // 현재 위치 기억
        message.get(packet); // 바이트 배열로 복사
        message.reset(); // 다시 처음으로 되돌림

        if (message.remaining() < 4) {
            System.out.println("⚠️ [웹] 너무 짧은 메시지 (" + message.remaining() + "B)");
            return;
        }
        int type = message.getInt();

        try {
            switch (type) {
                case MSG_PEN: {
                    long strokeId = message.getLong();
                    int n = message.getInt();
                    int color = message.getInt();
                    int size = message.getInt();
                    int expected = n * 8;
                    int available = message.remaining();
                    System.out.printf(
                        "✏️ [웹] PEN id=%d, N=%d, color=0x%08X, size=%d, payload=%dB (expected %dB)%n",
                        strokeId, n, color, size, available, expected
                    );

                    // ✨ 교수(웹)가 그린 선도 현재 페이지 히스토리에 저장해야
                    //    페이지를 전환했다 돌아오거나 새 학생이 접속할 때 재전송(replay)된다.
                    //    userId는 빈 문자열 → 웹이 다시 받을 때 작성자 '강사'로 해석된다.
                    MainServer.getHistoryForPage(MainServer.currentPage).put(
                        strokeId,
                        new MainServer.StrokeRecord(packet, "")
                    );
                    break;
                }
                case MSG_ERASE: {
                    long strokeId = message.getLong();
                    System.out.printf("🩹 [웹] ERASE id=%d%n", strokeId);

                    // ✨ 교수(웹)가 지운 선도 현재 페이지 히스토리에서 제거.
                    MainServer.getHistoryForPage(MainServer.currentPage).remove(strokeId);
                    break;
                }
                case MSG_PDF: {
                    int len = message.getInt();
                    MainServer.currentPDFPacket = packet; 
                    
                    // ✨ 새 PDF가 등록되면 페이지를 1로 리셋하고, 이전 PDF의 낙서 기록은 싹 지웁니다.
                    MainServer.currentPage = 1;
                    MainServer.pageStrokeHistory.clear();
                    
                    System.out.printf("📄 [웹] PDF length=%dB%n", len);
                    break;
                }
             // WebServer.java 내부의 case MSG_PAGE: 부분

             // WebServer.java 내부의 case MSG_PAGE: 로직 찾아서 교체

                case MSG_PAGE: {
                    int page = message.getInt();
                    MainServer.currentPage = page; // 서버 메모리에 현재 페이지 저장
                    System.out.printf("📖 [웹] PAGE 이동 신호 수신 -> page=%d%n", page);
                    
                    // 1. [C++ 학생들 화면 이동] 이미 접속해 있는 모든 C++ 학생들에게 "O페이지로 가라"고 8바이트 전송
                    java.nio.ByteBuffer pageBuf = java.nio.ByteBuffer.allocate(8);
                    pageBuf.order(java.nio.ByteOrder.BIG_ENDIAN);
                    pageBuf.putInt(3);    // 패킷 타입: 3 (MSG_PAGE)
                    pageBuf.putInt(page); // 이동할 페이지 번호
                    byte[] pagePacket = pageBuf.array();

                    for (ClientHandler client : MainServer.clients) {
                        if (client != null) {
                            client.sendData(pagePacket);
                        }
                    }

                    // 2. [과거 낙서장 열기] 이동한 페이지에 기존에 그려진 낙서 기록들을 가져옴
                    java.util.concurrent.ConcurrentHashMap<Long, MainServer.StrokeRecord> pageLines = MainServer.getHistoryForPage(page);
                    
                    // 과거 기록이 있다면 하나씩 꺼내서 가공 시작
                    if (pageLines != null && !pageLines.isEmpty()) {
                        System.out.printf("🔄 [동기화] %d페이지의 기존 낙서 %d개를 모두에게 재전송 중...%n", page, pageLines.size());
                        
                        for (MainServer.StrokeRecord record : pageLines.values()) {
                            // 안전장치: 데이터가 비어있다면 에러 내지 말고 통과
                            if (record == null || record.packet == null || record.userId == null) {
                                continue;
                            }

                            // 2-A. ✨ [C++ 학생들에게 낙서 전송] C++ 클라이언트들에게는 꼬리표 없는 순정 패킷(Type 0) 전송
                            for (ClientHandler client : MainServer.clients) {
                                if (client != null) {
                                    client.sendData(record.packet);
                                }
                            }

                            // 2-B. ✨ [교수님 웹 브라우저에 낙서 전송] 교수님 화면에는 누가 그렸는지 ID 꼬리표를 붙여서 전송
                            byte[] idBytes = record.userId.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                            
                            // webBuffer 변수를 for문 안에서 안전하게 선언하고 조립합니다.
                            java.nio.ByteBuffer webBuffer = java.nio.ByteBuffer.allocate(record.packet.length + 4 + idBytes.length);
                            webBuffer.order(java.nio.ByteOrder.BIG_ENDIAN);
                            
                            webBuffer.put(record.packet);            // 원래 펜 패킷 데이터 (Type 0 포함)
                            webBuffer.putInt(idBytes.length);  // 학생 ID 문자열 길이 (4바이트)
                            webBuffer.put(idBytes);            // 학생 ID 문자열 데이터
                            
                            // 이 메시지를 보낸 교수님 웹소켓 회선(conn)으로 전송
                            conn.send(webBuffer.array());
                        }
                    }
                    // ✨ 페이지 이동 패킷과 낙서 재전송은 위에서 이미 C++ 클라이언트에 보냈다.
                    //    여기서 break로 빠져 맨 아래 공통 중계 루프로 내려가면, 같은 페이지 이동
                    //    패킷이 한 번 더 전송되어 C++가 strokes.clear()를 또 실행한다.
                    //    그러면 방금 재전송한 낙서가 전부 지워지므로, 여기서 바로 return 한다.
                    return;
                }
                case MSG_USERS: {
                    System.out.println("👥 [웹] 인원 목록 새로고침 요청 수신");
                    MainServer.broadcastUserList();
                    return; // 인원 목록은 웹 전용이므로 C++ 클라이언트에게 중계하지 않음
                }
                default:
                    System.out.println("❓ [웹] 알 수 없는 type=" + type);
            }
            
            // 모든 C++ 클라이언트에게 중계
            for (ClientHandler client : MainServer.clients) {
                client.sendData(packet); 
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
        System.out.println("🚀 웹소켓 서버 가동 중… (Port: 8082)");
    }
}
