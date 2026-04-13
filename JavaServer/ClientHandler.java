package server;

import java.io.DataInputStream;
import java.io.IOException;
import java.net.Socket;

public class ClientHandler implements Runnable{
	private Socket socket;
	private String ID;
	
	public ClientHandler(Socket socket, String ID) {
		this.socket = socket;
		this.ID = ID;
	}
	
	@Override
	public void run() {
		System.out.println("사용자 접속! Thread 시작! 이름:" + ID);
        try (DataInputStream dataIn = new DataInputStream(socket.getInputStream())) {
            while (true) {
            	//보내는 x좌표와 y좌표를 읽어옴
                float x = dataIn.readFloat();
                float y = dataIn.readFloat();
                
                //color 정보는 우리끼리 약속(예: 검정(0) 빨강(1) 노랑(2))
                int color = dataIn.readInt();
                
                String message = x + "," + y + "," + color;

                // 3. 접속된 모든 웹 브라우저에게 실시간 전송
                if (main_server.webserver != null) {
                    main_server.webserver.broadcast(message);
                }

                System.out.println("웹으로 중계됨: " + message);
                
                System.out.println("보낸 사람:" + ID + "/IP:" + socket.getInetAddress() + " -> X: " + x + ", Y: " + y + ", Color: " + color);
            }
        } catch (IOException e) {
            System.out.println("연결 종료");
        }
    }

}
