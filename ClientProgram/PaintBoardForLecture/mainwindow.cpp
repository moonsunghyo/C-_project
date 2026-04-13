#include "mainwindow.h"

// mainwindow.ui를 기반으로 uic라는 QT도구가 만든 헤더파일.
// QT Creater로 .ui를 수정하면 해당 정보가 XML 형태 저장 됨.
#include "./ui_mainwindow.h"


#include <QMenuBar>
#include <QInputDialog>



MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent),ui(new Ui::MainWindow), canvas(nullptr)
{
    // design 탭에서 배치한 위젯들을 실제로 this에 생성 배치.
    ui->setupUi(this);

    // .ui에서 만든 액션 이름으로 연결
    connect(ui->actionNew_Canvas, &QAction::triggered, this, &MainWindow::onNewCanvas);
    connect(ui->actionPen, &QAction::triggered, this, &MainWindow::onPen);
    connect(ui->actionEraser, &QAction::triggered, this, &MainWindow::onEraser);
}

MainWindow::~MainWindow() {
    delete ui;
}


void MainWindow::onNewCanvas() {
    bool ok1, ok2;
    int w = QInputDialog::getInt(this, "Width",  "Enter width:",  400, 100, 2000, 1, &ok1);//간단히 사용자한테 숫자 입력 받기
    int h = QInputDialog::getInt(this, "Height", "Enter height:", 400, 100, 2000, 1, &ok2);

    if (!ok1 || !ok2) return;

    canvas = new Canvas(w, h, this);
/*
[ MenuBar ]
[ ToolBar ]
[-------------------]
[   CentralWidget   ]
[-------------------]
[ StatusBar ]
의 형태로 QMainWindow는 구성되는데, CentralWidget에 canvas 객체를 넣는다.
하나만 들어가기 때문에 여러번 호출하면, 전에 있던 객체는 지워진다.
*/
    setCentralWidget(canvas);
}

void MainWindow::onPen()
{
    if (canvas) canvas->setTool(Canvas::Tool::Pen);
}

void MainWindow::onEraser()
{
    if (canvas) canvas->setTool(Canvas::Tool::Eraser);
}