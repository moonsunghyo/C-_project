#include "mainwindow.h"

// mainwindow.ui를 기반으로 uic라는 QT도구가 만든 헤더파일.
// QT Creater로 .ui를 수정하면 해당 정보가 XML 형태 저장 됨.
#include "./ui_mainwindow.h"


#include <QTcpSocket>
#include <QDataStream>
#include <QInputDialog>
#include <QMessageBox>
#include <QMenuBar>
#include <QColorDialog>
#include <QSlider>
#include <QLineEdit>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent),ui(new Ui::MainWindow), canvas(nullptr), currentColor(Qt::black)
{
    // design 탭에서 배치한 위젯들을 실제로 this에 생성 배치.
    ui->setupUi(this);
    menuBar()->setNativeMenuBar(false);

    ui->penSlider->setRange(1, 50);
    ui->penSlider->setValue(2);
    ui->penSizeEdit->setText("2");


    // .ui에서 만든 액션 시그널에 연결
    //// 그림 그리기 관련
    connect(ui->actionNew_Canvas, &QAction::triggered, this, &MainWindow::onNewCanvas);
    connect(ui->actionPen, &QAction::triggered, this, &MainWindow::onPen);
    connect(ui->actionEraser, &QAction::triggered, this, &MainWindow::onEraser);
    connect(ui->penSlider,  &QSlider::valueChanged, this, &MainWindow::onPenSliderChanged);
    connect(ui->penSizeEdit, &QLineEdit::editingFinished, this, &MainWindow::onPenSizeEditChanged);
    connect(ui->colorPickerButton, &QPushButton::clicked, this, &MainWindow::onColorPicker);

    //// 서버 관련
    connect(ui->actionConnet_to_Server, &QAction::triggered, this, &MainWindow::onConnectToServer);


    // tcpSocket 초기화
    tcpSocket = new QTcpSocket(this);   //QT에서 데이터 송수신을 감지해서, 이 객체를 통해 시그널 함수들을 emit 해 줌

    //// tcpSocket의 시그널에 연결
    connect(tcpSocket, &QTcpSocket::readyRead, this, &MainWindow::onSocketReadyRead);       // 몇 바이트든 데이터가 들어 왔을 때,
    connect(tcpSocket, &QTcpSocket::disconnected, this, &MainWindow::onSocketDisconnected); // 연결이 끊겼을 때


}

MainWindow::~MainWindow() {
    delete ui;
}

// **********************************************************
//
//                           slots
//
// **********************************************************

void MainWindow::onNewCanvas() {
    int w = 800;
    int h = 600;

    if (canvas) {
        delete canvas;
        canvas = nullptr;
    }

    canvas = new Canvas(w, h, ui->canvasContainer);
    canvas->show();

    canvas->setPenColor(currentColor);
    canvas->setPenSize(ui->penSlider->value());


    // canvas의 signal에 연결
    //// 한 획이 끝났을 때, 서버로 획 보내기
    connect(canvas, &Canvas::strokeFinished, this, &MainWindow::sendStroke);
    //// 획이 지워졌을 때, 서버로 보내기.
    connect(canvas, &Canvas::eraseRequested,  this, &MainWindow::sendErase);
}

void MainWindow::onPen()
{
    if (canvas) canvas->setTool(Canvas::Tool::Pen);
}

void MainWindow::onEraser()
{
    if (canvas) canvas->setTool(Canvas::Tool::Eraser);
}


void MainWindow::onPenSliderChanged(int value)
{
    ui->penSizeEdit->setText(QString::number(value));   //슬라이더가 바뀌었으면 옆에 있는 텍스트도 바꿔 줌.
    if (canvas) canvas->setPenSize(value);
}

void MainWindow::onPenSizeEditChanged()
{
    bool ok;
    int value = ui->penSizeEdit->text().toInt(&ok); //완전히 입력이 됐는지를 포인터로 받고, 바뀐 값을 반환 한다.
    if (!ok || value < 1 || value > 50) {
        ui->penSizeEdit->setText(QString::number(ui->penSlider->value()));
        return;
    }
    ui->penSlider->setValue(value); //펜크기 바뀌었으니 옆에 있는 슬라이더도 변경
    if (canvas) canvas->setPenSize(value);
}



void MainWindow::onColorPicker()
{
    QColor color = QColorDialog::getColor(currentColor, this, "색상 선택"); //기본적으로 있는 색상 선택 dialog 팝업
    if (color.isValid()) {
        currentColor = color;
        ui->colorPickerButton->setStyleSheet(   // color picker 버튼 색 바꿔주기.
            QString("background-color: %1; border: 1px solid #888;").arg(color.name()));
        if (canvas) canvas->setPenColor(currentColor);
    }
}


// **********************************************************
//
//                       for server
//
// **********************************************************

void MainWindow::onConnectToServer() {
    bool ok;

    // 필요 정보 입력받기
    QString host = QInputDialog::getText(this, "서버 연결", "서버 IP:", QLineEdit::Normal, "172.20.10.2", &ok);
    if (!ok || host.isEmpty()) return;

    int port = QInputDialog::getInt(this, "서버 연결", "포트:", 8081, 1, 65535, 1, &ok);
    if (!ok) return;

    QString UserID = QInputDialog::getText(this, "서버 연결", "이름 (최대 10자):", QLineEdit::Normal, "", &ok);
    if (!ok || UserID.isEmpty()) return;

    // 서버에 접속
    tcpSocket->connectToHost(host, (quint16)port);
    if (tcpSocket->waitForConnected(3000)) {
        QByteArray idBytes = UserID.toUtf8().left(10).leftJustified(10, ' ', true); // 사용자 id 보내기
        tcpSocket->write(idBytes);
    } else {
        QMessageBox::warning(this, "연결 실패", "서버에 연결할 수 없어요.");
    }
}

void MainWindow::sendStroke(const Stroke& stroke) {
    if (!tcpSocket || tcpSocket->state() != QAbstractSocket::ConnectedState) return;

    QByteArray packet;
    QDataStream ds(&packet, QIODevice::WriteOnly);
    ds.setByteOrder(QDataStream::BigEndian);
    ds.setFloatingPointPrecision(QDataStream::SinglePrecision); // 필수 유지

    ds << (qint32)0; // type = Stroke
    ds << (qint64)stroke.id;
    ds << (qint32)stroke.points.size();
    ds << (qint32)stroke.color.rgba(); // ARGB int
    ds << (qint32)stroke.size;

    // ✨ 수정한 부분 ✨
    for (const QPoint& p : stroke.points) {
        // 계산 결과를 명확하게 float 타입 변수에 할당
        float normalizedX = static_cast<float>(p.x()) / static_cast<float>(canvas->width());
        float normalizedY = static_cast<float>(p.y()) / static_cast<float>(canvas->height());

        // 만들어진 float 변수를 그대로 전송
        ds << normalizedX;
        ds << normalizedY;
    }

    tcpSocket->write(packet);
}

void MainWindow::sendErase(qint64 strokeId) {
    if (!tcpSocket || tcpSocket->state() != QAbstractSocket::ConnectedState) return;

    QByteArray packet;
    QDataStream ds(&packet, QIODevice::WriteOnly);
    ds.setByteOrder(QDataStream::BigEndian);

    ds << (qint32)1;        // type = Erase
    ds << (qint64)strokeId;
    tcpSocket->write(packet);
}

void MainWindow::onSocketReadyRead() {
    receiveBuffer.append(tcpSocket->readAll()); // 소켓에서 받은 데이터 전부 붙여넣기.

    while (true) {
        if (receiveBuffer.size() < 4) break; // type 읽을 수 없음

        QDataStream ds(receiveBuffer);
        ds.setByteOrder(QDataStream::BigEndian);

        qint32 type;
        ds >> type;

        if (type == 0) {
            // Stroke: type(4) + id(8) + pointCount(4) + color(4) + size(4) = 24바이트
            if (receiveBuffer.size() < 24) break;
            qint64 id;
            qint32 pointCount, color, size;
            ds >> id >> pointCount >> color >> size;

            int totalSize = 24 + pointCount * 8;
            if (receiveBuffer.size() < totalSize) break;

            Stroke stroke;
            stroke.id    = id;
            stroke.color = QColor::fromRgba((QRgb)color);   // 정수형 색 표현은 QColor로 변환.
            stroke.size  = size;
            for (int i = 0; i < pointCount; i++) {
                float x, y;
                ds >> x >> y;
                stroke.points.append(QPoint((int) x , (int)y));
            }

            receiveBuffer.remove(0, totalSize); // 읽은 부분 지우기.
            if (canvas) canvas->onStrokeReceived(stroke);

        } else if (type == 1) {
            // Erase: type(4) + strokeId(8) = 8바이트
            if (receiveBuffer.size() < 12) break;
            qint64 strokeId;
            ds >> strokeId;
            receiveBuffer.remove(0, 12);
            if (canvas) canvas->onEraseReceived(strokeId);

        } else {
            // 알 수 없는 타입 — 버퍼 초기화 (오류 방어)
            receiveBuffer.clear();
            break;
        }
    }
}

void MainWindow::onSocketDisconnected() {
    qDebug() << "서버 연결 끊김";
}
