#include "mainwindow.h"

// mainwindow.ui를 기반으로 uic라는 QT도구가 만든 헤더파일.
// QT Creater로 .ui를 수정하면 해당 정보가 XML 형태 저장 됨.
#include "./ui_mainwindow.h"


#include <QMenuBar>
#include <QInputDialog>
#include <QHBoxLayout>
#include <QPushButton>
#include <QColorDialog>


MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent),ui(new Ui::MainWindow), canvas(nullptr), currentColor(Qt::black)
{
    // design 탭에서 배치한 위젯들을 실제로 this에 생성 배치.
    ui->setupUi(this);

    ui->penSlider->setRange(1, 50);
    ui->penSlider->setValue(2);
    ui->penSizeEdit->setText("2");


    // .ui에서 만든 액션 이름으로 연결
    connect(ui->actionNew_Canvas, &QAction::triggered, this, &MainWindow::onNewCanvas);
    connect(ui->actionPen, &QAction::triggered, this, &MainWindow::onPen);
    connect(ui->actionEraser, &QAction::triggered, this, &MainWindow::onEraser);
    connect(ui->penSlider,  &QSlider::valueChanged, this, &MainWindow::onPenSliderChanged);
    connect(ui->penSizeEdit, &QLineEdit::editingFinished, this, &MainWindow::onPenSizeEditChanged);
    connect(ui->colorPickerButton, &QPushButton::clicked, this, &MainWindow::onColorPicker);
}

MainWindow::~MainWindow() {
    delete ui;
}


void MainWindow::onNewCanvas() {
    bool ok1, ok2;
    int w = QInputDialog::getInt(this, "Width",  "Enter width:",  400, 100, 2000, 1, &ok1);//간단히 사용자한테 숫자 입력 받기
    int h = QInputDialog::getInt(this, "Height", "Enter height:", 400, 100, 2000, 1, &ok2);

    if (!ok1 || !ok2) return;

    if (canvas) {
        delete canvas;
        canvas = nullptr;
    }

    canvas = new Canvas(w, h, ui->canvasContainer);

    canvas->move(0, 0); // 명시적으로 위치 지정 (생략하면 기본값 (0,0))
    canvas->show();

    canvas->setPenColor(currentColor);
    canvas->setPenSize(ui->penSlider->value());
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
    ui->penSizeEdit->setText(QString::number(value));
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
    ui->penSlider->setValue(value);
    if (canvas) canvas->setPenSize(value);
}



void MainWindow::onColorPicker()
{
    QColor color = QColorDialog::getColor(currentColor, this, "색상 선택");
    if (color.isValid()) {
        currentColor = color;
        ui->colorPickerButton->setStyleSheet(
            QString("background-color: %1; border: 1px solid #888;").arg(color.name()));
        if (canvas) canvas->setPenColor(currentColor);
    }
}









