#ifndef COLORPICKERPOPUP_H
#define COLORPICKERPOPUP_H

#include <QWidget>
#include <QColor>

class ColorPickerPopup : public QWidget
{
    Q_OBJECT
public:
    explicit ColorPickerPopup(QWidget *parent = nullptr);
    void setColor(const QColor &color);

signals:
    void colorChanged(const QColor &color);

protected:
    void paintEvent(QPaintEvent *event) override;
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;

private:
    enum class Zone { None, SV, Hue, Preset };

    QRectF svRect()     const;
    QRectF hueRect()    const;
    QRectF swatchRect() const;

    void handleMouse(QPoint pos, bool pressed);
    void emitColor();

    qreal m_h = 0.0;
    qreal m_s = 1.0;
    qreal m_v = 1.0;
    Zone  m_drag = Zone::None;

    static constexpr int kPad      = 4;
    static constexpr int kInner    = 140;
    static constexpr int kSVH      = 120;
    static constexpr int kHueH     = 14;
    static constexpr int kPresetH  = 18;   // 프리셋 원 행 높이 (원 지름 14 + 상하 여백)
    static constexpr int kSwH      = 14;
    static constexpr int kGap      = 6;
};

#endif // COLORPICKERPOPUP_H
