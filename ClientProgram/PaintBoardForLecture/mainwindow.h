#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "canvas.h"

#include <QMainWindow>

class QWidget;
class QColor;
class QTcpSocket;
class QByteArray;

QT_BEGIN_NAMESPACE
// ui_mainwindow.h 안에 선언될 클래스 전방 선언.
namespace Ui { class MainWindow; }
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow() override;

private slots:
    void onNewCanvas();                     // 새 캠버스 눌렀을 때
    void onPen();                           // 펜 눌렀을 때
    void onEraser();                       // 지우개 눌렀을 때
    void onColorPicker();                  // 색 고르는 버튼 눌렀을 때.
    void onPenSliderChanged(int value);   // 슬라이더 변경 시
    void onPenSizeEditChanged();          // 텍스트 입력 변경 시

    // 서버 관련
    void onConnectToServer();           // 서버랑 연결 할 때
    void onSocketReadyRead();           // 서버에서 데이터를 받을 때
    void onSocketDisconnected();        // 서버랑 연결이 끊겼을 때

    void sendStroke(const Stroke& stroke);      // 서버에 한 획 보내기
    void sendErase(qint64 strokeId);            // 지운 획 id 보내기

private:
    void setupColorPalette();             // 색상 버튼 생성 함수
    void updateCanvasLayout();            // New Canvas 후 레이아웃 재배치

    // canvas 생성 및 시그널 연결을 한 곳에서 처리하는 헬퍼 함수
    // onNewCanvas와 PDF 수신 양쪽에서 공통으로 사용
    void createCanvas(int w, int h);

private:
    //실제 위젯들이 정의되어 있을 객체.
    Ui::MainWindow *ui;

    //윈도우에 띄울 canvas 객체
    Canvas* canvas;
    QColor currentColor;        // 지금 골라진 색.

    // 서버 관련
    QTcpSocket* tcpSocket;      // tcp 통신 도와줄 객체
    QByteArray  receiveBuffer;  // 수신 받은 직렬화 데이터 저장한 객체
};
#endif // MAINWINDOW_H