#ifndef CANVAS_H
#define CANVAS_H

// gui 컴포넌트 기본 클래스 헤더.
#include <QWidget>
// 이미지 저장할 수 있는 클래스 헤더.
#include <QImage>
// 좌표 저장용 클래스 헤더.
#include <QPoint>
// 색 저장하는 클래스 헤더
#include <QColor>

struct Stroke {
    QList<QPoint> points; // 한 획을 저장할 리스트.
    QColor color;
    int size;
};

class Canvas : public QWidget
{
    // qt만의 이벤트 처리에 필요한 코드.
    Q_OBJECT

public:
    // tool이 많이 추가되면 상속으로 구현이 확장성이 좋으나, 그렇게 많은 게 추가 될 것 같진 않으니 enum으로.
    enum class Tool {Pen, Eraser};

    //메모리 관리 편의성을 위해서 부모를 입력 받을 수도 있음.
    explicit Canvas(int w, int h, QWidget *parent = nullptr);

    void setTool(Tool tool);
    void setPenSize(int size);
    void setEraserSize(int size);
    void setPenColor(const QColor& color);

protected:
    //화면 다시 그릴 때 호출되는 함수.
    //update가 호출되거나, 화면이 가려졌었다거나 할 때가 다시 그림.
    void paintEvent(QPaintEvent *event) override;


    // 마우스 액션 관리하는 함수.
    // "QT->QWidget->override된 이벤트 함수"의 형태로 관리되며, QT가 알아서 호출 해준다고 함.
    // QMouseEvent에 함수가 호출될 때의 마우스 상태를 담아서 인자로 전달 해 줌.
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;


private:
    void drawStroke(QPainter &painter, const Stroke& stroke);

    QList<Stroke> strokes; // 지금까지 그린 모든 획들을 가지고 있음.
    Stroke currentStroke;
    bool drawing;


    QColor penColor;
    Tool currentTool;
    int penSize;
    int eraserSize;
};

#endif // CANVAS_H
