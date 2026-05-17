#ifndef CANVAS_H
#define CANVAS_H

// gui 컴포넌트 기본 클래스 헤더.
#include <QWidget>
#include <QPdfDocument> // Qt PDF 모듈: PDF 파일을 열고 페이지를 렌더링하는 클래스

class QPainter;
class QMouseEvent;
class QPaintEvent;

struct Stroke {
    QList<QPoint> points; // 한 획을 저장할 리스트.
    QColor color;
    int size;
    qint64 id = -1;
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

    // 서버에서 받은 Stroke 받기
    void onStrokeReceived(const Stroke& stroke);
    // 서버에서 받은 무슨 Stroke 지웠는지를 받기
    void onEraseReceived(qint64 strokeId);

    // 서버로부터 PDF 바이트 데이터를 받아 로드 후 첫 페이지를 배경으로 렌더링
    // pdfData: PDF 파일 전체 바이트
    void onPdfReceived(const QByteArray& pdfData);

    // 서버로부터 표시할 페이지 번호를 받아 전환
    // pageIndex: 0-based 페이지 인덱스
    void onPageIndexReceived(int pageIndex);

private slots: //시그널이랑 연결될 수 있는 함수들이라는 범위 지정자, slots를 쓰면 자동으로 시그널과 연결 해 주는 등의 기능 제공.

    //화면 다시 그릴 때 호출되는 함수.
    //update가 호출되거나, 화면이 가려졌었다거나 할 때가 다시 그림.
    void paintEvent(QPaintEvent *event) override;

    // 마우스 액션 관리하는 함수.
    // "QT->QWidget->override된 이벤트 함수"의 형태로 관리되며, QT가 알아서 호출 해준다고 함.
    // QMouseEvent에 함수가 호출될 때의 마우스 상태를 담아서 인자로 전달 해 줌.
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;

signals:
    void strokeFinished(const Stroke& stroke);  // 한 획을 다 그렸을 때를 다른 객체에 알려주기 위한 시그널.
    void eraseRequested(qint64 strokeId); // 한 획을 지웠을 때 다른 객체에 알려주기 위한 시그널.

private:
    void drawStroke(QPainter &painter, const Stroke& stroke);   //획을 그리는 함수.

    // 현재 pageIndex의 PDF 페이지를 캔버스 크기에 맞게 렌더링해 backgroundImage에 저장
    void renderCurrentPage();

    QList<Stroke> strokes; // 지금까지 그린 모든 획들을 가지고 있음.
    Stroke currentStroke;
    bool drawing;

    QColor penColor;
    Tool currentTool;
    int penSize;
    int eraserSize;

    // PDF 관련
    QPdfDocument *pdfDocument;  // PDF 문서를 보유하는 객체 (QPdfDocument)
    QImage backgroundImage;     // 현재 페이지를 래스터화한 이미지, paintEvent에서 배경으로 그림
    int currentPageIndex;       // 현재 표시 중인 페이지 인덱스 (0-based)
};

#endif // CANVAS_H