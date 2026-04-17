#include "canvas.h"
#include <QPainter>
#include <QMouseEvent>
#include <QRandomGenerator>

Canvas::Canvas(int w, int h, QWidget *parent)
    : QWidget(parent),
    drawing(false),
    currentTool(Tool::Pen),
    penSize(2),
    eraserSize(10),
    penColor(Qt::black)
{
    setFixedSize(w, h); // 크기 못 바꿈.
    setAutoFillBackground(true);    // 자동으로 배경은 채워 줌.

    QPalette p = palette(); //현재 위젯에서 쓰고 있는 색상 규칙 가져옴.
    p.setColor(QPalette::Window, Qt::white);    //window(배경색) 을 흰색으로 바꾸고
    setPalette(p);  // 현재 위젯에 적용.
}

//**********************************************************
//
//                        setter
//
//**********************************************************

void Canvas::setTool(Tool tool) {currentTool = tool;}
void Canvas::setPenSize(int size){penSize = size;}
void Canvas::setEraserSize(int size) {eraserSize = size;}
void Canvas::setPenColor(const QColor& color) {penColor = color;}




//**********************************************************
//
//                        slots
//
//**********************************************************


void Canvas::paintEvent(QPaintEvent *event)
{
    //QPainter : 그린다는 행위 모든 것들을 관장하는 객체.
    QPainter painter(this); //지금 이 객체에
    painter.setRenderHint(QPainter::Antialiasing); // 그릴 때, Antialiasing 적용한 채로 그리기.

    for (const Stroke &stroke : strokes)    // 현제 모든 획을 다 그린다.
        drawStroke(painter, stroke);

    if (drawing)    // 지금 그리고 있는 중이라면, 그리고 있던 획도 그린다.
        drawStroke(painter, currentStroke);
}

void Canvas::mousePressEvent(QMouseEvent *event)
{
    if (event->button() == Qt::LeftButton) {    //좌클릭이 됐을 때, 획 초기화.
        drawing = true;
        currentStroke.points.clear();
        currentStroke.color = penColor;
        currentStroke.size  = (currentTool == Tool::Eraser) ? eraserSize : penSize;
        currentStroke.id = (qint64)QRandomGenerator::global()->generate64(); // 랜덤한 64비트 정수
        if (currentTool == Tool::Pen) currentStroke.points.append(event->pos());
        update();
    }
}

void Canvas::mouseMoveEvent(QMouseEvent *event)
{
    // 윈도우 안에서 클릭하고, 움직였을 때만 그린다.
    if (event->buttons() & Qt::LeftButton && drawing) {
        if (currentTool == Tool::Eraser) {
            QRect eraserRect(
                event->pos() - QPoint(eraserSize / 2, eraserSize / 2),
                QSize(eraserSize, eraserSize)
                );  // 현재 지우개 크기와 위치

            strokes.removeIf([&](const Stroke &stroke) {    // 모든 획에 대해서
                for (const QPoint &p : stroke.points)   //획의 점들이
                    if (eraserRect.contains(p)) {
                        emit eraseRequested(stroke.id); // 제거 요청 콜백
                        return true;    // 지우개와 겹친다면 제거한다.
                    }
                return false;
            });

            update();
        } else {
            currentStroke.points.append(event->pos());
            update();
        }
    }
}

void Canvas::mouseReleaseEvent(QMouseEvent *event) {
    if (event->button() == Qt::LeftButton && drawing) {
        drawing = false;
        if (currentTool == Tool::Pen && !currentStroke.points.isEmpty()){    //획이 비어있지 않고 현제가 펜이라면
            strokes.append(currentStroke);
            emit strokeFinished(currentStroke);         // 그림 요청 콜백
        }

        currentStroke.points.clear();
        update();
    }

}

void Canvas::onStrokeReceived(const Stroke& stroke) {
    strokes.append(stroke);
    update();
}

void Canvas::onEraseReceived(int strokeId) {
    strokes.removeIf([strokeId](const Stroke& s) {
        return s.id == strokeId;
    });

    update();
}

void Canvas::drawStroke(QPainter &painter, const Stroke& stroke) {
    if (stroke.points.size() == 1) {    //한 획에 점이 1개 일 때
        painter.setPen(QPen(stroke.color, stroke.size, Qt::SolidLine, Qt::RoundCap)); // RounCap : 선의 양 끝 점을 둥글게
        painter.drawPoint(stroke.points[0]);
        return;
    }

    painter.setPen(QPen(stroke.color, stroke.size, Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin)); // roundJoin : 선이 꺾일 떄 부드럽게 연결
    for (int i = 1; i < stroke.points.size(); ++i)
        painter.drawLine(stroke.points[i - 1], stroke.points[i]);
}