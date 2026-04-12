#include "canvas.h"
#include <QPainter>
#include <QMouseEvent>

Canvas::Canvas(int w, int h, QWidget *parent)
    : QWidget(parent), image(w, h, QImage::Format_RGB32)
{
    image.fill(Qt::white); // 배경 흰색 칠하기.
    setFixedSize(w, h); // 크기 못 바꿈.
}

void Canvas::paintEvent(QPaintEvent *)
{
    //QPainter : 그린다는 행위 모든 것들을 관장하는 객체.
    QPainter painter(this); //지금 이 객체에
    painter.drawImage(0, 0, image); // image를 (0,0) 부터 그림.
}

void Canvas::mousePressEvent(QMouseEvent *event)
{
    if (event->button() == Qt::LeftButton) {    // 좌클릭 했을 때,
        lastPoint = event->pos();
    }
}

void Canvas::mouseMoveEvent(QMouseEvent *event)
{
    // 버튼을 누르고 창 밖으로 나가고,
    // 버튼을 때고 화면 안으로 들어 왔을 때,
    // drawing은 계속 true라서 drawing 외에 실제로 눌려있는 지 확인하는 조건 추가.
    if (event->buttons() & Qt::LeftButton) {
        QPainter painter(&image);
        painter.setPen(QPen(Qt::black, 2));
        painter.drawLine(lastPoint, event->pos());
        lastPoint = event->pos();
        update();
    }
}