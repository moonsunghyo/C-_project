#include "colorpickerpopup.h"
#include <QPainter>
#include <QLinearGradient>
#include <QMouseEvent>

ColorPickerPopup::ColorPickerPopup(QWidget *parent)
    : QWidget(parent)
{
    setFixedSize(kInner + 2 * kPad,
                 kPad + kSVH + kGap + kHueH + kGap + kPresetH + kGap + kSwH + kPad);
}

void ColorPickerPopup::setColor(const QColor &color)
{
    float h, s, v;
    color.getHsvF(&h, &s, &v);
    m_h = (h < 0.0f) ? 0.0 : h;   // achromatic(흰/검/회색)이면 Qt가 -1 반환
    m_s = s;
    m_v = v;
    update();
}

// ── 영역 정의 ──────────────────────────────────────────────
QRectF ColorPickerPopup::svRect() const
{
    return { kPad, kPad, kInner, kSVH };
}

QRectF ColorPickerPopup::hueRect() const
{
    return { kPad, kPad + kSVH + kGap, kInner, kHueH };
}

QRectF ColorPickerPopup::swatchRect() const
{
    return { kPad, kPad + kSVH + kGap + kHueH + kGap + kPresetH + kGap, kInner, kSwH };
}

// ── 그리기 ─────────────────────────────────────────────────
void ColorPickerPopup::paintEvent(QPaintEvent *)
{
    QPainter p(this);
    p.setRenderHint(QPainter::Antialiasing);

    // 배경
    p.fillRect(rect(), QColor(0x25, 0x25, 0x26));
    p.setPen(QPen(QColor("#3c3c3c"), 1));
    p.drawRect(rect().adjusted(0, 0, -1, -1));

    const QRectF sv = svRect();
    const QRectF hu = hueRect();
    const QRectF sw = swatchRect();
    const QColor hueColor = QColor::fromHsvF(m_h, 1.0, 1.0);

    // ── SV 사각형 ──
    // 1) 가로 그라디언트: 흰색 → 순수 색상 (채도 변화)
    QLinearGradient hGrad(sv.left(), 0, sv.right(), 0);
    hGrad.setColorAt(0.0, Qt::white);
    hGrad.setColorAt(1.0, hueColor);
    p.fillRect(sv, hGrad);

    // 2) 세로 그라디언트 오버레이: 투명 → 검정 (밝기 변화)
    QLinearGradient vGrad(0, sv.top(), 0, sv.bottom());
    vGrad.setColorAt(0.0, QColor(0, 0, 0, 0));
    vGrad.setColorAt(1.0, QColor(0, 0, 0, 255));
    p.fillRect(sv, vGrad);

    // SV 인디케이터 (현재 채도·밝기 위치)
    const QPointF svPt(sv.left() + m_s * sv.width(),
                       sv.top()  + (1.0 - m_v) * sv.height());
    p.setPen(QPen(QColor(0, 0, 0, 80), 3));
    p.setBrush(Qt::NoBrush);
    p.drawEllipse(svPt, 7, 7);
    p.setPen(QPen(Qt::white, 1.5));
    p.drawEllipse(svPt, 7, 7);

    // ── 색상 바 ──
    QLinearGradient hueGrad(hu.left(), 0, hu.right(), 0);
    hueGrad.setColorAt(0.0/6, QColor(255, 0,   0  ));   // 빨강
    hueGrad.setColorAt(1.0/6, QColor(255, 255, 0  ));   // 노랑
    hueGrad.setColorAt(2.0/6, QColor(0,   255, 0  ));   // 초록
    hueGrad.setColorAt(3.0/6, QColor(0,   255, 255));   // 청록
    hueGrad.setColorAt(4.0/6, QColor(0,   0,   255));   // 파랑
    hueGrad.setColorAt(5.0/6, QColor(255, 0,   255));   // 자홍
    hueGrad.setColorAt(1.0,   QColor(255, 0,   0  ));   // 다시 빨강
    p.fillRect(hu, hueGrad);

    // 색상 바 인디케이터 (세로 선)
    const qreal hx = hu.left() + m_h * hu.width();
    p.setPen(QPen(QColor(0, 0, 0, 100), 3));
    p.drawLine(QPointF(hx, hu.top()), QPointF(hx, hu.bottom()));
    p.setPen(QPen(Qt::white, 1.5));
    p.drawLine(QPointF(hx, hu.top()), QPointF(hx, hu.bottom()));

    // ── 프리셋 버튼 ──
    static const QColor kPresets[4] = {
        Qt::black,
        QColor(220, 38,  38),   // 빨강
        QColor(37,  99,  235),  // 파랑
        QColor(22,  163, 74),   // 초록
    };
    const qreal pw  = kInner / 4.0;
    const qreal ppy = kPad + kSVH + kGap + kHueH + kGap;
    for (int i = 0; i < 4; ++i) {
        const qreal r  = (kPresetH - 4) / 2.0;          // 원 반지름
        const qreal cx = kPad + (i + 0.5) * pw;         // 각 구역 중앙
        const qreal cy = ppy + kPresetH / 2.0;
        p.setBrush(kPresets[i]);
        p.setPen(QPen(QColor("#3c3c3c"), 1));
        p.drawEllipse(QPointF(cx, cy), r, r);
    }

    // ── 현재 색상 스와치 ──
    p.fillRect(sw, QColor::fromHsvF(m_h, m_s, m_v));
    p.setPen(QPen(QColor("#3c3c3c"), 1));
    p.drawRect(sw.adjusted(0, 0, -1, -1));
}

// ── 마우스 상호작용 ────────────────────────────────────────
void ColorPickerPopup::handleMouse(QPoint pos, bool pressed)
{
    if (pressed) {
        const qreal pw  = kInner / 4.0;
        const qreal ppy = kPad + kSVH + kGap + kHueH + kGap;

        if (svRect().contains(pos)) {
            m_drag = Zone::SV;
        } else if (hueRect().contains(pos)) {
            m_drag = Zone::Hue;
        } else if (QRectF(kPad, ppy, kInner, kPresetH).contains(pos)) {
            static const QColor kPresets[4] = {
                Qt::black,
                QColor(220, 38,  38),
                QColor(37,  99,  235),
                QColor(22,  163, 74),
            };
            int idx = qBound(0, (int)((pos.x() - kPad) / pw), 3);
            setColor(kPresets[idx]);
            emitColor();
            m_drag = Zone::None;
            return;
        } else {
            m_drag = Zone::None;
        }
    }

    const QRectF sv = svRect();
    const QRectF hu = hueRect();

    if (m_drag == Zone::SV) {
        m_s = qBound(0.0, (pos.x() - sv.left()) / sv.width(),  1.0);
        m_v = qBound(0.0, 1.0 - (pos.y() - sv.top()) / sv.height(), 1.0);
        update();
        emitColor();
    } else if (m_drag == Zone::Hue) {
        m_h = qBound(0.0, (pos.x() - hu.left()) / hu.width(), 1.0);
        update();
        emitColor();
    }
}

void ColorPickerPopup::mousePressEvent(QMouseEvent *event)
{
    handleMouse(event->pos(), true);
}

void ColorPickerPopup::mouseMoveEvent(QMouseEvent *event)
{
    handleMouse(event->pos(), false);
}

void ColorPickerPopup::mouseReleaseEvent(QMouseEvent *)
{
    m_drag = Zone::None;
}

void ColorPickerPopup::emitColor()
{
    emit colorChanged(QColor::fromHsvF(m_h, m_s, m_v));
}
