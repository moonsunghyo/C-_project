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
#include <QVBoxLayout>  // canvasContainer에 레이아웃을 붙이기 위해 필요
#include <QBuffer>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent),ui(new Ui::MainWindow), canvas(nullptr), currentColor(Qt::black)
{
    // design 탭에서 배치한 위젯들을 실제로 this에 생성 배치.
    ui->setupUi(this);
    menuBar()->setNativeMenuBar(false);

    // canvasContainer에 QVBoxLayout을 미리 붙여둔다.
    // 이렇게 해야 createCanvas에서 캔버스를 레이아웃에 추가할 때
    // canvasContainer가 캔버스 크기를 제대로 반영해서 쪼그라드는 현상을 막을 수 있다.
    QVBoxLayout *containerLayout = new QVBoxLayout(ui->canvasContainer);
    containerLayout->setContentsMargins(0, 0, 0, 0);
    containerLayout->setAlignment(Qt::AlignTop | Qt::AlignLeft); // 캔버스를 좌상단 기준으로 배치
    ui->canvasContainer->setLayout(containerLayout);

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
    bool ok1, ok2;
    int w = QInputDialog::getInt(this, "Width",  "Enter width:",  400, 100, 2000, 1, &ok1);//간단히 사용자한테 숫자 입력 받기
    int h = QInputDialog::getInt(this, "Height", "Enter height:", 400, 100, 2000, 1, &ok2);

    if (!ok1 || !ok2) return;

    createCanvas(w, h);
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

void MainWindow::createCanvas(int w, int h) {
    // 기존 캔버스가 있으면 레이아웃에서 제거 후 삭제
    if (canvas) {
        ui->canvasContainer->layout()->removeWidget(canvas);
        delete canvas;
        canvas = nullptr;
    }

    canvas = new Canvas(w, h, ui->canvasContainer);

    // canvasContainer의 레이아웃에 캔버스를 추가한다.
    // 레이아웃에 들어가야 canvasContainer가 캔버스 크기를 반영해서
    // 메인 윈도우가 올바른 크기로 늘어난다.
    ui->canvasContainer->layout()->addWidget(canvas);

    canvas->setPenColor(currentColor);
    canvas->setPenSize(ui->penSlider->value());

    // canvas의 signal에 연결
    //// 한 획이 끝났을 때, 서버로 획 보내기
    connect(canvas, &Canvas::strokeFinished, this, &MainWindow::sendStroke);
    //// 획이 지워졌을 때, 서버로 보내기.
    connect(canvas, &Canvas::eraseRequested, this, &MainWindow::sendErase);
}

void MainWindow::sendStroke(const Stroke& stroke) {
    if (!tcpSocket || tcpSocket->state() != QAbstractSocket::ConnectedState) return;

    QByteArray packet;
    QDataStream ds(&packet, QIODevice::WriteOnly);  //QByteArray에 데이터 쓰는 걸 도와주는 인터페이스
    ds.setByteOrder(QDataStream::BigEndian);
    ds.setFloatingPointPrecision(QDataStream::SinglePrecision); // 필수 유지

    ds << (qint32)0; // type = Stroke
    ds << (qint64)stroke.id;
    ds << (qint32)stroke.points.size();
    ds << (qint32)stroke.color.rgba(); // ARGB int
    ds << (qint32)stroke.size;
    for (const QPoint& p : stroke.points) {
        // 계산 결과를 명확하게 float 타입 변수에 할당
        float normalizedX = static_cast<float>(p.x()) / static_cast<float>(canvas->width());
        float normalizedY = static_cast<float>(p.y()) / static_cast<float>(canvas->height());

        // 만들어진 float 변수를 그대로 전송
        ds << normalizedX;
        ds << normalizedY;
    }

    tcpSocket->write(packet);   // 서버로 보내기.
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
    // 소켓에 들어온 데이터를 누적 버퍼에 추가
    receiveBuffer.append(tcpSocket->readAll());

    // QDataStream은 루프 바깥에서 딱 한 번만 선언 (매우 중요!)
    QDataStream ds(&receiveBuffer, QIODevice::ReadOnly);
    ds.setByteOrder(QDataStream::BigEndian);
    ds.setFloatingPointPrecision(QDataStream::SinglePrecision);

    while (true) {
        if (ds.device()->bytesAvailable() < 4) break;

        qint32 type;
        ds >> type; // type 소비

        if (type == 0) {
            // 나머지: id(8) + pointCount(4) + color(4) + size(4) = 20바이트
            if (ds.device()->bytesAvailable() < 20) break;

            char headerBuf[20];
            ds.device()->peek(headerBuf, 20);
            qint32 pointCount;
            memcpy(&pointCount, &headerBuf[8], sizeof(qint32)); // id(8) 다음
            pointCount = qFromBigEndian(pointCount);

            if (ds.device()->bytesAvailable() < 20 + pointCount * 8) break;

            qint64 id;
            qint32 actualPointCount, color, size;
            ds >> id >> actualPointCount >> color >> size;

            Stroke stroke;
            stroke.id    = id;
            stroke.color = QColor::fromRgba((QRgb)color);   // 정수형 색 표현은 QColor로 변환.
            stroke.size  = size;
            for (int i = 0; i < actualPointCount; i++) {
                float x, y;
                ds >> x >> y;
                // [0,1] 정규화된 좌표를 캔버스 픽셀 좌표로 역정규화
                stroke.points.append(QPoint(
                    static_cast<int>(x * canvas->width()),
                    static_cast<int>(y * canvas->height())
                    ));
            }

            receiveBuffer.remove(0, 24 + pointCount * 8); // 읽은 부분 지우기.
            if (canvas) canvas->onStrokeReceived(stroke);

        } else if (type == 1) {
            // Erase: type(4) + strokeId(8) = 12바이트
            if (ds.device()->bytesAvailable() < 8) break;

            qint64 strokeId;
            ds >> strokeId;

            receiveBuffer.remove(0, 12);
            if (canvas) canvas->onEraseReceived(strokeId);

        } else if (type == 2) {
            // PDF: type(4) + length(4) + pdfData(length)
            // 헤더 length 필드(4바이트)가 다 왔는지 먼저 확인
            if (ds.device()->bytesAvailable() < 4) break;

            char lenBuf[4];
            ds.device()->peek(lenBuf, 4);
            qint32 pdfLength;
            memcpy(&pdfLength, lenBuf, 4);
            pdfLength = qFromBigEndian(pdfLength);

            if (ds.device()->bytesAvailable() < 4 + pdfLength) break; // PDF 바이트가 다 오지 않았으면 대기

            qint32 dummyLength;
            ds >> dummyLength;
            QByteArray pdfData(pdfLength, 0);
            ds.readRawData(pdfData.data(), pdfLength);

            receiveBuffer.remove(0, 8 + pdfLength); // 읽은 부분 지우기.

            // PDF에서 첫 페이지 크기를 읽어 캔버스를 해당 크기로 새로 만든다
            // QPdfDocument를 잠깐 로컬에서 사용하므로 멤버로 들고 있을 필요 없음
            {
                QPdfDocument tempDoc;
                QBuffer buf;
                buf.setData(pdfData);
                buf.open(QIODevice::ReadOnly);
                tempDoc.load(&buf);

                if (tempDoc.pageCount() > 0) {
                    // pagePointSize(): 페이지 크기를 pt 단위 QSizeF로 반환
                    // pt값을 픽셀로 그대로 사용
                    QSize pageSize = tempDoc.pagePointSize(0).toSize();
                    createCanvas(pageSize.width(), pageSize.height());
                } else if (!canvas) {
                    createCanvas(800, 600); // PDF 파싱 실패 시 기본 크기로 생성
                }
            }

            if (canvas) canvas->onPdfReceived(pdfData);

        } else if (type == 3) {
            // 페이지 번호: type(4) + pageIndex(4) = 8바이트
            if (ds.device()->bytesAvailable() < 4) break;

            qint32 pageIndex;
            ds >> pageIndex;

            receiveBuffer.remove(0, 8);
            if (canvas) canvas->onPageIndexReceived((int)pageIndex - 1);

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