#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "canvas.h"

#include <QMainWindow>
#include <QColor>

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
    void onNewCanvas();
    void onPen();
    void onEraser();
    void onColorPicker();
    void onPenSliderChanged(int value);   // 슬라이더 변경 시
    void onPenSizeEditChanged();          // 텍스트 입력 변경 시


private:
    void setupColorPalette();             // 색상 버튼 생성 함수
    void updateCanvasLayout();            // New Canvas 후 레이아웃 재배치


private:
    //실제 위젯들이 정의되어 있을 객체.
    Ui::MainWindow *ui;

    //윈도우에 띄울 canvas 객체
    Canvas* canvas;
    QColor currentColor;
};
#endif // MAINWINDOW_H
