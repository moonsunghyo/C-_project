package server;
import java.io.*;
import java.net.*;

public class main_server {
    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket(8081);
        System.out.println("Online Canvas 가동 중...(포트:8081)");

        while (true) {
            Socket socket = serverSocket.accept(); // 학생 접속!
            
            DataInputStream name = new DataInputStream(socket.getInputStream());
            
            //소켓의 이름을 읽음
            byte[] buffer = new byte[10];
            int length = name.read(buffer); 
            
            //문자열로 변환
            String ID = new String(buffer, 0, length).trim();
            
            //외부접근(브라우저) 차단
            if (ID.contains("GET") || ID.contains("HTTP")) {
                System.out.println("잘못된 접근(브라우저) 차단!");
                socket.close();
                continue; 
            }
            
            
            //접속에 대한 새로운 작업자(스레드) 할당 후 실행
            Thread t = new Thread(new ClientHandler(socket,ID));
            
            t.start();
            
        }
    }
}
