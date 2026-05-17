package server;
import java.io.*;
import java.net.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class MainServer {
    // 웹소켓 서버 (8082)
    public static WebServer webserver = new WebServer(8082);
    
    // ✨ C++ 클라이언트(ClientHandler)들을 모두 담아둘 스레드 안전 명단(List) ✨
    public static CopyOnWriteArrayList<ClientHandler> clients = new CopyOnWriteArrayList<>();

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
            
            // ✨ 명단에 방금 접속한 클라이언트 추가! ✨
            clients.add(handler);
            System.out.println(ID + " 님이 접속했습니다. (현재 총 " + clients.size() + "명)");
            
            Thread t = new Thread(handler);
            t.start();
        }
    }
}
