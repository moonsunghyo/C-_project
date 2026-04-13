#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "canvas.h"

#include <QMainWindow>

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

protected:
    void onNewCanvas();
    void onPen();
    void onEraser();

private:
    //실제 위젯들이 정의되어 있을 객체.
    Ui::MainWindow *ui;

    //윈도우에 띄울 canvas 객체
    Canvas* canvas;
};
#endif // MAINWINDOW_H
