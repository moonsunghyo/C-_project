package server;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;

public class ClientHandler implements Runnable {
    private Socket socket;
    private String ID;
    private DataOutputStream dos; 

    public ClientHandler(Socket socket, String ID) {
        this.socket = socket;
        this.ID = ID;
        try {
            this.dos = new DataOutputStream(socket.getOutputStream());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void sendData(byte[] data) {
        try {
            dos.write(data);
            dos.flush();
        } catch (IOException e) {
            System.out.println(ID + " 님에게 전송 실패");
        }
    }

    public String getID() {
        return ID;
    }

    @Override
    public void run() {
        try (DataInputStream dis = new DataInputStream(socket.getInputStream())) {
            // 1. 접속 시 출석부 갱신 브로드캐스트
            MainServer.broadcastUserList();

            // 2. [PDF 동기화]
            if (MainServer.currentPDFPacket != null) {
                System.out.println("🚀 [동기화] 새 접속자 " + ID + "에게 기존 PDF 전송 시작...");
                this.sendData(MainServer.currentPDFPacket);
            }

            // 3. [페이지 동기화] 늦게 온 사람 화면을 현재 교수님 페이지로 강제 이동!
            ByteBuffer pageSyncBuf = ByteBuffer.allocate(8);
            pageSyncBuf.order(ByteOrder.BIG_ENDIAN);
            pageSyncBuf.putInt(3); // MSG_PAGE 타입
            pageSyncBuf.putInt(MainServer.currentPage);
            this.sendData(pageSyncBuf.array());

            // 4. [낙서 동기화] 'StrokeRecord' 상자에서 학생용 순정 패킷(packet)만 꺼내서 전송!
            ConcurrentHashMap<Long, MainServer.StrokeRecord> currentLines = MainServer.getHistoryForPage(MainServer.currentPage);
            if (!currentLines.isEmpty()) {
                System.out.println("🚀 [동기화] " + ID + "에게 " + MainServer.currentPage + "페이지 낙서 " + currentLines.size() + "개 전송...");
                for (MainServer.StrokeRecord record : currentLines.values()) {
                    this.sendData(record.packet); // C++ 학생에게는 무조건 꼬리표 없는 순정 패킷만!
                }
            }

            // 5. 실시간 데이터 수신 루프
            while (true) {
                int type = dis.readInt();

                if (type == 0) { // MSG_PEN
                    long strokeId = dis.readLong();
                    int pointCount = dis.readInt();
                    int color = dis.readInt();
                    int penSize = dis.readInt();

                    int totalBytes = 24 + (pointCount * 8);
                    ByteBuffer buffer = ByteBuffer.allocate(totalBytes);
                    buffer.order(ByteOrder.BIG_ENDIAN);
                    
                    buffer.putInt(type);
                    buffer.putLong(strokeId);
                    buffer.putInt(pointCount);
                    buffer.putInt(color);
                    buffer.putInt(penSize);

                    for (int i = 0; i < pointCount; i++) {
                        buffer.putFloat(dis.readFloat());
                        buffer.putFloat(dis.readFloat());
                    }

                    byte[] packet = buffer.array();

                    // ✨ [수정] 순정 패킷 + 학생 ID 문자열만 깔끔하게 묶어서 Map에 저장!
                    MainServer.getHistoryForPage(MainServer.currentPage).put(
                        strokeId, 
                        new MainServer.StrokeRecord(packet, this.ID)
                    );

                    // [학생용] 다른 C++ 클라이언트에게 순정 패킷 전송
                    for (ClientHandler client : MainServer.clients) {
                        if (client != this) { 
                            client.sendData(packet);
                        }
                    }

                    // ✨ [교수님용 꼬리표] 기존에 웹이 해석하던 포맷 (문자열 길이 4B + 문자열 데이터) 으로 복구!
                    if (MainServer.webserver != null) {
                        byte[] idBytes = this.ID.getBytes(StandardCharsets.UTF_8);
                        
                        ByteBuffer webBuffer = ByteBuffer.allocate(packet.length + 4 + idBytes.length);
                        webBuffer.order(ByteOrder.BIG_ENDIAN);
                        
                        webBuffer.put(packet);
                        webBuffer.putInt(idBytes.length); // 1. ID 문자열 길이 (4바이트)
                        webBuffer.put(idBytes);           // 2. 학생 ID 문자열
                        
                        MainServer.webserver.broadcast(webBuffer.array());
                    }

                } else if (type == 1) { // MSG_ERASE
                    long strokeId = dis.readLong();
                    
                    ByteBuffer buffer = ByteBuffer.allocate(12);
                    buffer.order(ByteOrder.BIG_ENDIAN);
                    
                    buffer.putInt(type);
                    buffer.putLong(strokeId);
                    byte[] packet = buffer.array();

                    // [삭제] '현재 페이지 낙서장'에서 해당 선 지우기
                    MainServer.getHistoryForPage(MainServer.currentPage).remove(strokeId);

                    for (ClientHandler client : MainServer.clients) {
                        if (client != this) {
                            client.sendData(packet);
                        }
                    }
                    if (MainServer.webserver != null) MainServer.webserver.broadcast(packet);
                }
            }
        } catch (EOFException e) {
            System.out.println(ID + " 클라이언트가 나갔습니다.");
        } catch (IOException e) {
            System.out.println(ID + " 통신 에러 발생: " + e.getMessage());
        } finally {
            MainServer.clients.remove(this);
            System.out.println(ID + " 명단에서 제거됨. (남은 인원: " + MainServer.clients.size() + "명)");
            
            MainServer.broadcastUserList();

            try {
                if (socket != null && !socket.isClosed()) socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
