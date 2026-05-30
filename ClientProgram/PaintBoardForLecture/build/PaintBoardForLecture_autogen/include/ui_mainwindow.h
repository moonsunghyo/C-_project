/********************************************************************************
** Form generated from reading UI file 'mainwindow.ui'
**
** Created by: Qt User Interface Compiler version 6.11.0
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MAINWINDOW_H
#define UI_MAINWINDOW_H

#include <QtCore/QVariant>
#include <QtGui/QAction>
#include <QtWidgets/QApplication>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QSlider>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QToolBar>
#include <QtWidgets/QVBoxLayout>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_MainWindow
{
public:
    QAction *actionNew_Canvas;
    QAction *actionPen;
    QAction *actionEraser;
    QAction *actionConnet_to_Server;
    QWidget *centralwidget;
    QHBoxLayout *horizontalLayout;
    QWidget *canvasContainer;
    QWidget *sidePanelWidget;
    QVBoxLayout *sidePanel;
    QHBoxLayout *toolButtonArea;
    QPushButton *penButton;
    QPushButton *eraserButton;
    QWidget *penSizeArea;
    QVBoxLayout *penSizeAreaLayout;
    QLabel *label_2;
    QHBoxLayout *penSizeEditArea;
    QSlider *penSlider;
    QLineEdit *penSizeEdit;
    QSpacerItem *sidePanelSpacer;
    QStatusBar *statusbar;
    QToolBar *toolBar;

    void setupUi(QMainWindow *MainWindow)
    {
        if (MainWindow->objectName().isEmpty())
            MainWindow->setObjectName("MainWindow");
        MainWindow->resize(1154, 728);
        MainWindow->setStyleSheet(QString::fromUtf8("\n"
"QMainWindow {\n"
"    background-color: #1e1e1e;\n"
"}\n"
"\n"
"QWidget#centralwidget {\n"
"    background-color: #1e1e1e;\n"
"}\n"
"\n"
"/* \342\224\200\342\224\200 Menu \342\224\200\342\224\200 */\n"
"QMenuBar {\n"
"    background-color: #252526;\n"
"    color: #cccccc;\n"
"    border-bottom: 1px solid #3c3c3c;\n"
"    padding: 2px 4px;\n"
"    font-size: 13px;\n"
"}\n"
"QMenuBar::item {\n"
"    padding: 4px 10px;\n"
"    border-radius: 4px;\n"
"}\n"
"QMenuBar::item:selected {\n"
"    background-color: #37373d;\n"
"    color: #ffffff;\n"
"}\n"
"QMenu {\n"
"    background-color: #252526;\n"
"    color: #cccccc;\n"
"    border: 1px solid #3c3c3c;\n"
"    border-radius: 6px;\n"
"    padding: 4px;\n"
"}\n"
"QMenu::item {\n"
"    padding: 6px 20px;\n"
"    border-radius: 4px;\n"
"}\n"
"QMenu::item:selected {\n"
"    background-color: #094771;\n"
"    color: #ffffff;\n"
"}\n"
"\n"
"/* \342\224\200\342\224\200 Toolbar \342\224\200\342\224\200 */\n"
"QToolBar {\n"
"    background-color: #252526;\n"
"    border-"
                        "bottom: 1px solid #3c3c3c;\n"
"    spacing: 4px;\n"
"    padding: 3px 6px;\n"
"}\n"
"QToolBar::separator {\n"
"    background-color: #3c3c3c;\n"
"    width: 1px;\n"
"    margin: 4px 6px;\n"
"}\n"
"QToolButton {\n"
"    background-color: transparent;\n"
"    color: #cccccc;\n"
"    border: none;\n"
"    border-radius: 5px;\n"
"    padding: 5px 14px;\n"
"    font-size: 13px;\n"
"}\n"
"QToolButton:hover {\n"
"    background-color: #37373d;\n"
"    color: #ffffff;\n"
"}\n"
"QToolButton:pressed, QToolButton:checked {\n"
"    background-color: #094771;\n"
"    color: #ffffff;\n"
"}\n"
"\n"
"/* \342\224\200\342\224\200 Labels \342\224\200\342\224\200 */\n"
"QLabel {\n"
"    color: #9d9d9d;\n"
"    font-size: 8pt;\n"
"    font-weight: 600;\n"
"}\n"
"\n"
"/* \342\224\200\342\224\200 Slider \342\224\200\342\224\200 */\n"
"QSlider::groove:horizontal {\n"
"    height: 4px;\n"
"    background-color: #3c3c3c;\n"
"    border-radius: 2px;\n"
"}\n"
"QSlider::handle:horizontal {\n"
"    background-color: #0e7fd4;\n"
"    width:"
                        " 14px;\n"
"    height: 14px;\n"
"    margin: -5px 0;\n"
"    border-radius: 7px;\n"
"}\n"
"QSlider::handle:horizontal:hover {\n"
"    background-color: #1b9aff;\n"
"}\n"
"QSlider::sub-page:horizontal {\n"
"    background-color: #0e7fd4;\n"
"    border-radius: 2px;\n"
"}\n"
"\n"
"/* \342\224\200\342\224\200 Line Edit \342\224\200\342\224\200 */\n"
"QLineEdit {\n"
"    background-color: #2d2d2d;\n"
"    color: #cccccc;\n"
"    border: 1px solid #3c3c3c;\n"
"    border-radius: 5px;\n"
"    padding: 4px 6px;\n"
"    font-size: 13px;\n"
"    selection-background-color: #094771;\n"
"}\n"
"QLineEdit:focus {\n"
"    border-color: #0e7fd4;\n"
"}\n"
"\n"
"/* \342\224\200\342\224\200 Status Bar \342\224\200\342\224\200 */\n"
"QStatusBar {\n"
"    background-color: #007acc;\n"
"    color: #ffffff;\n"
"    font-size: 12px;\n"
"}\n"
"   "));
        actionNew_Canvas = new QAction(MainWindow);
        actionNew_Canvas->setObjectName("actionNew_Canvas");
        actionPen = new QAction(MainWindow);
        actionPen->setObjectName("actionPen");
        actionPen->setMenuRole(QAction::MenuRole::NoRole);
        actionEraser = new QAction(MainWindow);
        actionEraser->setObjectName("actionEraser");
        actionEraser->setMenuRole(QAction::MenuRole::NoRole);
        actionConnet_to_Server = new QAction(MainWindow);
        actionConnet_to_Server->setObjectName("actionConnet_to_Server");
        centralwidget = new QWidget(MainWindow);
        centralwidget->setObjectName("centralwidget");
        horizontalLayout = new QHBoxLayout(centralwidget);
        horizontalLayout->setSpacing(0);
        horizontalLayout->setObjectName("horizontalLayout");
        horizontalLayout->setContentsMargins(0, 0, 0, 0);
        canvasContainer = new QWidget(centralwidget);
        canvasContainer->setObjectName("canvasContainer");
        canvasContainer->setStyleSheet(QString::fromUtf8("background-color: #2b2b2b;"));

        horizontalLayout->addWidget(canvasContainer);

        sidePanelWidget = new QWidget(centralwidget);
        sidePanelWidget->setObjectName("sidePanelWidget");
        sidePanelWidget->setMinimumSize(QSize(180, 0));
        sidePanelWidget->setMaximumSize(QSize(180, 16777215));
        sidePanelWidget->setStyleSheet(QString::fromUtf8("\n"
"QWidget {\n"
"    background-color: #252526;\n"
"    border-left: 1px solid #3c3c3c;\n"
"}\n"
"        "));
        sidePanel = new QVBoxLayout(sidePanelWidget);
        sidePanel->setSpacing(12);
        sidePanel->setObjectName("sidePanel");
        sidePanel->setContentsMargins(16, 20, 16, 20);
        toolButtonArea = new QHBoxLayout();
        toolButtonArea->setSpacing(8);
        toolButtonArea->setObjectName("toolButtonArea");
        penButton = new QPushButton(sidePanelWidget);
        penButton->setObjectName("penButton");
        penButton->setStyleSheet(QString::fromUtf8("\n"
"QPushButton {\n"
"    background-color: #3c3c3c;\n"
"    color: #aaaaaa;\n"
"    border: 1px solid #555555;\n"
"    border-radius: 6px;\n"
"    font-size: 13px;\n"
"    font-weight: 600;\n"
"    padding: 7px 0;\n"
"}\n"
"QPushButton:hover {\n"
"    background-color: #4a4a4a;\n"
"    border-color: #6a6a6a;\n"
"    color: #ffffff;\n"
"}\n"
"QPushButton:checked {\n"
"    background-color: #0e4f8a;\n"
"    border: 1.5px solid #0e7fd4;\n"
"    color: #ffffff;\n"
"}\n"
"             "));
        penButton->setCheckable(true);

        toolButtonArea->addWidget(penButton);

        eraserButton = new QPushButton(sidePanelWidget);
        eraserButton->setObjectName("eraserButton");
        eraserButton->setStyleSheet(QString::fromUtf8("\n"
"QPushButton {\n"
"    background-color: #3c3c3c;\n"
"    color: #aaaaaa;\n"
"    border: 1px solid #555555;\n"
"    border-radius: 6px;\n"
"    font-size: 13px;\n"
"    font-weight: 600;\n"
"    padding: 7px 0;\n"
"}\n"
"QPushButton:hover {\n"
"    background-color: #4a4a4a;\n"
"    border-color: #6a6a6a;\n"
"    color: #ffffff;\n"
"}\n"
"QPushButton:checked {\n"
"    background-color: #0e4f8a;\n"
"    border: 1.5px solid #0e7fd4;\n"
"    color: #ffffff;\n"
"}\n"
"             "));
        eraserButton->setCheckable(true);

        toolButtonArea->addWidget(eraserButton);


        sidePanel->addLayout(toolButtonArea);

        penSizeArea = new QWidget(sidePanelWidget);
        penSizeArea->setObjectName("penSizeArea");
        penSizeAreaLayout = new QVBoxLayout(penSizeArea);
        penSizeAreaLayout->setSpacing(8);
        penSizeAreaLayout->setObjectName("penSizeAreaLayout");
        penSizeAreaLayout->setContentsMargins(0, 0, 0, 0);
        label_2 = new QLabel(penSizeArea);
        label_2->setObjectName("label_2");

        penSizeAreaLayout->addWidget(label_2);

        penSizeEditArea = new QHBoxLayout();
        penSizeEditArea->setSpacing(8);
        penSizeEditArea->setObjectName("penSizeEditArea");
        penSlider = new QSlider(penSizeArea);
        penSlider->setObjectName("penSlider");
        penSlider->setOrientation(Qt::Orientation::Horizontal);

        penSizeEditArea->addWidget(penSlider);

        penSizeEdit = new QLineEdit(penSizeArea);
        penSizeEdit->setObjectName("penSizeEdit");
        penSizeEdit->setAlignment(Qt::AlignmentFlag::AlignCenter);

        penSizeEditArea->addWidget(penSizeEdit);

        penSizeEditArea->setStretch(0, 9);
        penSizeEditArea->setStretch(1, 1);

        penSizeAreaLayout->addLayout(penSizeEditArea);


        sidePanel->addWidget(penSizeArea);

        sidePanelSpacer = new QSpacerItem(20, 40, QSizePolicy::Policy::Minimum, QSizePolicy::Policy::Expanding);

        sidePanel->addItem(sidePanelSpacer);

        sidePanel->setStretch(3, 1);

        horizontalLayout->addWidget(sidePanelWidget);

        horizontalLayout->setStretch(0, 1);
        MainWindow->setCentralWidget(centralwidget);
        statusbar = new QStatusBar(MainWindow);
        statusbar->setObjectName("statusbar");
        MainWindow->setStatusBar(statusbar);
        toolBar = new QToolBar(MainWindow);
        toolBar->setObjectName("toolBar");
        MainWindow->addToolBar(Qt::ToolBarArea::TopToolBarArea, toolBar);

        toolBar->addAction(actionNew_Canvas);
        toolBar->addAction(actionConnet_to_Server);

        retranslateUi(MainWindow);

        QMetaObject::connectSlotsByName(MainWindow);
    } // setupUi

    void retranslateUi(QMainWindow *MainWindow)
    {
        MainWindow->setWindowTitle(QCoreApplication::translate("MainWindow", "PaintBoard", nullptr));
        actionNew_Canvas->setText(QCoreApplication::translate("MainWindow", "New Canvas", nullptr));
        actionPen->setText(QCoreApplication::translate("MainWindow", "Pen", nullptr));
        actionEraser->setText(QCoreApplication::translate("MainWindow", "Eraser", nullptr));
        actionConnet_to_Server->setText(QCoreApplication::translate("MainWindow", "Connect to Server", nullptr));
        penButton->setText(QCoreApplication::translate("MainWindow", "Pen", nullptr));
        eraserButton->setText(QCoreApplication::translate("MainWindow", "Eraser", nullptr));
        label_2->setText(QCoreApplication::translate("MainWindow", "Pen Size", nullptr));
        toolBar->setWindowTitle(QCoreApplication::translate("MainWindow", "toolBar", nullptr));
    } // retranslateUi

};

namespace Ui {
    class MainWindow: public Ui_MainWindow {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINWINDOW_H
