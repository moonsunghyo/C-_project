#include "canvas.h"
#include <QPainter>
#include <QMouseEvent>

Canvas::Canvas(int w, int h, QWidget *parent)
    : QWidget(parent),
    drawing(false),
    currentTool(Tool::Pen),
    penSize(2),
    eraserSize(10),
    penColor(Qt::black)
{
    setFixedSize(w, h); // 크기 못 바꿈.
    setAutoFillBackground(true);    // ????

    QPalette p = palette();
    p.setColor(QPalette::Window, Qt::white);
    setPalette(p);  // ????
}

void Canvas::setTool(Tool tool) {currentTool = tool;}
void Canvas::setPenSize(int size){penSize = size;}
void Canvas::setEraserSize(int size) {eraserSize = size;}
void Canvas::setPenColor(const QColor& color) {penColor = color;}


void Canvas::paintEvent(QPaintEvent *)
{
    //QPainter : 그린다는 행위 모든 것들을 관장하는 객체.
    QPainter painter(this); //지금 이 객체에
    painter.setRenderHint(QPainter::Antialiasing); // ??

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
        if (currentTool == Tool::Pen) currentStroke.points.append(event->pos());
        update();
    }
}

void Canvas::mouseMoveEvent(QMouseEvent *event)
{
    // 버튼을 누르고 창 밖으로 나가고,
    // 버튼을 때고 화면 안으로 들어 왔을 때,
    // drawing은 계속 true라서 drawing 외에 실제로 눌려있는 지 확인하는 조건 추가.
    if (event->buttons() & Qt::LeftButton && drawing) {
        if (currentTool == Tool::Eraser) {
            QRect eraserRect(
                event->pos() - QPoint(eraserSize / 2, eraserSize / 2),
                QSize(eraserSize, eraserSize)
                );  // 현재 지우개 크기와 위치, 왜 원으로는 안 함?

            strokes.removeIf([&](const Stroke &stroke) {    // 모든 획에 대해서
                for (const QPoint &p : stroke.points)   //획의 점들이
                    if (eraserRect.contains(p)) return true;    // 지우개와 겹친다면 제거한다.
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
        if (currentTool == Tool::Pen && !currentStroke.points.isEmpty())    //획이 비어있지 않고 현제가 펜이라면
            strokes.append(currentStroke);
        currentStroke.points.clear();
        update();
    }

}

void Canvas::drawStroke(QPainter &painter, const Stroke& stroke) {
    if (stroke.points.size() == 1) {    //한 획에 점이 1개 일 때
        painter.setPen(QPen(stroke.color, stroke.size, Qt::SolidLine, Qt::RoundCap)); // ???
        painter.drawPoint(stroke.points[0]);
        return;
    }

    painter.setPen(QPen(stroke.color, stroke.size, Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin)); // ???
    for (int i = 1; i < stroke.points.size(); ++i)
        painter.drawLine(stroke.points[i - 1], stroke.points[i]);
}