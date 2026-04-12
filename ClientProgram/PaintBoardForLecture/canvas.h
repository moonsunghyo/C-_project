#ifndef CANVAS_H
#define CANVAS_H

#include <QWidget>
// gui 컴포넌트 기본 클래스 헤더.
#include <QImage>
// 이미지 저장할 수 있는 클래스 헤더.
#include <QPoint>
// 좌표 저장용 객체 헤더.

class Canvas : public QWidget
{
    Q_OBJECT
    // qt만의 이벤트 처리에 필요한 코드.

public:
    explicit Canvas(int w, int h, QWidget *parent = nullptr);
    //메모리 관리 편의성을 위해서 부모를 입력 받을 수도 있음.

protected:
    void paintEvent(QPaintEvent *event) override;
    //화면 다시 그릴 때 호출되는 함수.
    //update가 호출되거나, 화면이 가려졌었다거나 할 때가 다시 그림.


    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    // 마우스 액션 관리하는 함수.
    // "QT->QWidget->override된 이벤트 함수"의 형태로 관리되며, QT가 알아서 호출 해준다고 함.
    // QMouseEvent에 함수가 호출될 때의 마우스 상태를 담아서 인자로 전달 해 줌.

private:
    QImage image;
    // 그린 그림을 저장하고 있을 객체.

    QPoint lastPoint;
    // 선 그으려면 전의 위치를 알고 있어야 함.
    // mouseMoveEvent가 호출 하면서 그림이 그려지는데, 이 함수가 충분히 자주 호출이 안 돼서
    // 이전 위치 없이 그냥 그으면, 선이 끊김.
};

#endif // CANVAS_H
