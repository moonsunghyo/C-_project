#include "mainwindow.h"

#include <QApplication>
#include <QInputDialog>
#include "canvas.h"

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);

    bool ok1, ok2;
    int w = QInputDialog::getInt(nullptr, "Width", "Enter width:", 400, 100, 2000, 1, &ok1);
    int h = QInputDialog::getInt(nullptr, "Height", "Enter height:", 400, 100, 2000, 1, &ok2);

    if (!ok1 || !ok2) return 0;

    Canvas canvas(w, h);
    canvas.show();

    return a.exec();
}