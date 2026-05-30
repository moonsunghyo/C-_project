package server;
import java.io.*;
import java.net.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class MainServer {
    // 웹소켓 서버 (8082)
    public static WebServer webserver = new WebServer(8082);
    public static byte[] currentPDFPacket = null;
    
    // 현재 전체 강의가 몇 페이지인지 서버가 기억합니다. (기본값 1페이지)
    public static int currentPage = 1;
    public static CopyOnWriteArrayList<ClientHandler> clients = new CopyOnWriteArrayList<>();
    
    // ✨ [수정 1] Map이 바이트 배열(byte[]) 대신 StrokeRecord 객체를 통째로 저장하도록 타입 변경!
    // 구조: ConcurrentHashMap<페이지번호, ConcurrentHashMap<선ID, StrokeRecord>>
    public static ConcurrentHashMap<Integer, ConcurrentHashMap<Long, StrokeRecord>> pageStrokeHistory = new ConcurrentHashMap<>();

    // ✨ [수정 2] 특정 페이지의 낙서장을 가져오는 헬퍼 함수의 반환 타입도 StrokeRecord에 맞게 변경!
    public static ConcurrentHashMap<Long, StrokeRecord> getHistoryForPage(int page) {
        return pageStrokeHistory.computeIfAbsent(page, k -> new ConcurrentHashMap<>());
    }
    
    // ✨ [수정 3] 쓰레드 ID(threadId)는 빼고, "순정 패킷 + 학생 문자열 ID"만 묶어주는 상자로 원상복구!
    public static class StrokeRecord {
        public byte[] packet;
        public String userId;
        
        public StrokeRecord(byte[] packet, String userId) {
            this.packet = packet;
            this.userId = userId;
        }
    }

    // 접속 인원 목록 브로드캐스트 (Type 4)
    public static void broadcastUserList() {
        if (webserver == null) return;

        // 포맷: int32(4) | int32 count | [int32 nameLen | bytes name] * count
        int totalSize = 8;
        for (ClientHandler c : clients) {
            totalSize += 4 + c.getID().getBytes(StandardCharsets.UTF_8).length;
        }

        ByteBuffer buffer = ByteBuffer.allocate(totalSize);
        buffer.putInt(4); // MSG_USERS
        buffer.putInt(clients.size());

        for (ClientHandler c : clients) {
            byte[] nameBytes = c.getID().getBytes(StandardCharsets.UTF_8);
            buffer.putInt(nameBytes.length);
            buffer.put(nameBytes);
        }

        webserver.broadcast(buffer.array());
    }

    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket(8081);
        System.out.println("Online Canvas 가동 중...(포트:8081)");
        
        webserver.start();

        while (true) {
            Socket socket = serverSocket.accept(); // 학생 접속!
            
            DataInputStream name = new DataInputStream(socket.getInputStream());
            byte[] buffer = new byte[10];
            int length = name.read(buffer); 
            String ID = new String(buffer, 0, length).trim();
            
            if (ID.contains("GET") || ID.contains("HTTP")) {
                System.out.println("잘못된 접근(브라우저) 차단!");
                socket.close();
                continue; 
            }
            
            // 작업자(스레드) 생성
            ClientHandler handler = new ClientHandler(socket, ID);
            
            // 명단에 방금 접속한 클라이언트 추가!
            clients.add(handler);
            System.out.println(ID + " 님이 접속했습니다. (현재 총 " + clients.size() + "명)");
            
            // ✨ [보너스 추가] 새로운 학생이 들어왔으니 교수님 출석부(UserList) 즉시 갱신!
            broadcastUserList();
            
            Thread t = new Thread(handler);
            t.start();
        }
    }
}
