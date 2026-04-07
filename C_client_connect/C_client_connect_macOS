#include <SFML/Graphics.hpp>
#include <iostream>
#include <cstring>
#include <cstdio>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <cstdint>

// float을 Big-Endian 4바이트로 변환 (Java readFloat() 호환)
void sendFloat(int sock, float value) {
    uint32_t tmp;
    memcpy(&tmp, &value, 4);
    tmp = htonl(tmp);
    send(sock, &tmp, 4, 0);
}

// int를 Big-Endian 4바이트로 변환 (Java readInt() 호환)
void sendInt(int sock, int value) {
    uint32_t tmp = htonl((uint32_t)value);
    send(sock, (char*)&tmp, 4, 0);
}

// 서버 IP, 포트 설정해두기
static const char* SERVER_IP   = "172.20.10.2";
static const int   SERVER_PORT = 8081;

int main() {
    // 1. 서버 접속
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in serv_addr;
    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port   = htons(SERVER_PORT);
    inet_pton(AF_INET, SERVER_IP, &serv_addr.sin_addr);

    if (connect(sock, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
        std::cout << "서버 접속 실패!" << std::endl;
        return -1;
    }
    std::cout << "서버 접속 성공!" << std::endl;

    // 아이디 전송
    std::string ID = "문성효";
    send(sock, ID.c_str(), ID.size(), 0);

    // **** 여기서부터 아래로는 임의로 SFML라이브러리 캔버스 띄워서 데이터 전송한 부분입니다.
    // 2. SFML 창 생성
    const int WIDTH  = 800;
    const int HEIGHT = 600;
    sf::RenderWindow window(sf::VideoMode({(unsigned)WIDTH, (unsigned)HEIGHT}), "Canvas Client");
    window.setFramerateLimit(60);

    // 드로잉용 텍스처 (그린 내용 누적)
    sf::RenderTexture canvas({(unsigned)WIDTH, (unsigned)HEIGHT});
    canvas.clear(sf::Color::White);
    canvas.display();

    // 처음 그리기 상태 false , color 0으로 초기화
    bool isDrawing = false;
    sf::Vector2i prevPos; // 60프레임으로 읽기 때문에 60프레임 마다 찍히는 두 점을 잇는 방식으로 그림.
    int color = 0;

    // 3. 이벤트 루프
    while (window.isOpen()) {
        while (const std::optional event = window.pollEvent()) {
            // 창 닫기 (서버 종료시)
            if (event->is<sf::Event::Closed>()) {
                window.close();
            }

            // 마우스 버튼 누름 → 드로잉 시작
            if (const auto* e = event->getIf<sf::Event::MouseButtonPressed>()) { // 마우스 눌렀을 때
                if (e->button == sf::Mouse::Button::Left) { // 좌클릭일 때
                    isDrawing = true; // 그리기 시작
                    prevPos = { e->position.x, e->position.y };

                    // 클릭 좌표 전송 (상대좌표 0~1, Big-Endian float)
                    sendFloat(sock, e->position.x / (float)WIDTH);
                    sendFloat(sock, e->position.y / (float)HEIGHT);
                    sendInt(sock, color);
                    std::cout << "전송: " << e->position.x / (float)WIDTH << "," << e->position.y / (float)HEIGHT << std::endl;
                }
            }

            // 마우스 버튼 뗌 → 드로잉 종료
            if (const auto* e = event->getIf<sf::Event::MouseButtonReleased>()) {
                if (e->button == sf::Mouse::Button::Left) {
                    isDrawing = false;
                }
            }
        }

        // 마우스 드래그: 이벤트 대신 매 프레임 폴링 (macOS 호환)
        if (sf::Mouse::isButtonPressed(sf::Mouse::Button::Left)) {
            sf::Vector2i curPos = sf::Mouse::getPosition(window);

            // 창 범위 안일 때만 처리
            if (curPos.x >= 0 && curPos.y >= 0 &&
                curPos.x < WIDTH && curPos.y < HEIGHT) {

                if (isDrawing && curPos != prevPos) {
                    // 로컬 캔버스에 선 그리기
                    sf::Vertex line[2];
                    line[0].position = sf::Vector2f(prevPos);
                    line[0].color    = sf::Color::Black;
                    line[1].position = sf::Vector2f(curPos);
                    line[1].color    = sf::Color::Black; // 색은 변수명에 따라 바뀌는거 구현 X, 위에서 임의값 0만 전송하게 되어있음
                    canvas.draw(line, 2, sf::PrimitiveType::Lines);
                    canvas.display();
                    // 작동잘하는지 터미널에도 출력
                    std::cout << "이동: " << curPos.x / (float)WIDTH << "," << curPos.y / (float)HEIGHT << std::endl;

                    // 드래그 좌표 전송 (상대좌표 0~1, Big-Endian float)
                    sendFloat(sock, curPos.x / (float)WIDTH);
                    sendFloat(sock, curPos.y / (float)HEIGHT);
                    sendInt(sock, color);
                }
                prevPos = curPos;
            }
        }

        // 4. 화면 렌더링
        window.clear(sf::Color::White);
        sf::Sprite sprite(canvas.getTexture());
        window.draw(sprite);
        window.display();
    }

    close(sock);
    return 0;
}
