#include "mainwindow.h"

#include <QApplication>
#include <QStyleFactory>


int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    a.setStyle(QStyleFactory::create("Fusion")); // 플랫폼 무관하게 스타일시트가 완전히 적용되도록
    // 프로그램에서 받아야 할 이벤트들을 가져와주는 역할.
    // OS로부터 받아올 인자들로 초기화 됨.

    MainWindow mw;  // 화면에 띄우게 될 메인 윈도우 객체
    mw.show();  // 윈도우 화면에 띄우기

    return a.exec();    // QApplication 객체의 exec 함수 통해 이벤트 루프를 실행시키고, 종료 전까지 계속 실행 됨.
}