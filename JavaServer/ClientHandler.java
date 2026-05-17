package server;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.net.Socket;
import java.nio.ByteBuffer;

public class ClientHandler implements Runnable {
    private Socket socket;
    private String ID;
    // ✨ C++ 클라이언트에게 데이터를 쏠 때 사용할 출력 스트림 ✨
    private DataOutputStream dos; 

    public ClientHandler(Socket socket, String ID) {
        this.socket = socket;
        this.ID = ID;
        try {
            // 출력 스트림 초기화
            this.dos = new DataOutputStream(socket.getOutputStream());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // ✨ 다른 사람에게 바이트 배열을 전송하는 메소드 ✨
    public void sendData(byte[] data) {
        try {
            dos.write(data);
            dos.flush(); // 버퍼를 비워 즉시 전송
        } catch (IOException e) {
            System.out.println(ID + " 님에게 전송 실패");
        }
    }

    @Override
    public void run() {
        try (DataInputStream dis = new DataInputStream(socket.getInputStream())) {
            while (true) {
                int type = dis.readInt();

                if (type == 0) {
                    long strokeId = dis.readLong();
                    int pointCount = dis.readInt();
                    int color = dis.readInt();
                    int penSize = dis.readInt();

                    // 1. 읽은 데이터를 똑같이 담을 상자 준비
                    int totalBytes = 24 + (pointCount * 8);
                    ByteBuffer buffer = ByteBuffer.allocate(totalBytes);
                    
                    buffer.putInt(type);
                    buffer.putLong(strokeId);
                    buffer.putInt(pointCount);
                    buffer.putInt(color);
                    buffer.putInt(penSize);

                    for (int i = 0; i < pointCount; i++) {
                        buffer.putFloat(dis.readFloat());
                        buffer.putFloat(dis.readFloat());
                    }

                    // 완성된 바이트 배열
                    byte[] packet = buffer.array();

                    // ✨ 2. C++ Broadcast: 명단에 있는 모든 사람에게 쏘기 ✨
                    for (ClientHandler client : MainServer.clients) {
                        // 자기가 그린 선을 자기가 또 받으면 두 번 그려지므로 자신은 제외!
                        if (client != this) { 
                            client.sendData(packet);
                        }
                    }

                    // (선택) 웹브라우저에도 동시에 쏘고 싶다면 이 줄을 살려둡니다.
                    if (MainServer.webserver != null) MainServer.webserver.broadcast(packet);

                } else if (type == 1) {
                    long strokeId = dis.readLong();
                    
                    ByteBuffer buffer = ByteBuffer.allocate(12);
                    buffer.putInt(type);
                    buffer.putLong(strokeId);
                    byte[] packet = buffer.array();

                    // 지우기 명령도 모두에게 쏘기
                    for (ClientHandler client : MainServer.clients) {
                        if (client != this) {
                            client.sendData(packet);
                        }
                    }
                }
            }
        } catch (EOFException e) {
            System.out.println(ID + " 클라이언트가 나갔습니다.");
        } catch (IOException e) {
            System.out.println(ID + " 통신 에러 발생.");
        } finally {
            // ✨ 클라이언트가 나가면 명단에서 반드시 제거! ✨
            MainServer.clients.remove(this);
            System.out.println(ID + " 명단에서 제거됨. (남은 인원: " + MainServer.clients.size() + "명)");
            try {
                if (socket != null && !socket.isClosed()) socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
