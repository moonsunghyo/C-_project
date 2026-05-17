# 강의 필기 — 교수자 페이지 (React + Vite)

PDF 강의 자료를 업로드하고 그 위에 실시간으로 필기할 수 있는 교수자용 웹 페이지입니다.

## 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 프로덕션 빌드
npm run build
npm run preview
```

기본 개발 포트: `http://localhost:5173`

## 기능

- 세션 코드 생성 (6자 영숫자)
- PDF 드래그앤드롭 업로드
- pdf.js 기반 페이지 렌더링
- 좌측 썸네일 사이드바 / 페이지별 필기 인디케이터
- 펜 (굵기 1–24px), 지우개
- 페이지별 실행 취소 / 다시 실행 / 전체 지우기
- 키보드 단축키:
  - `⌘Z` / `Ctrl+Z` — 실행 취소
  - `⌘⇧Z` / `Ctrl+Y` — 다시 실행
  - `←` / `→` — 페이지 이동
  - `P` — 펜, `E` — 지우개

## 디렉터리 구조

```
src/
├── main.jsx              # React entry
├── App.jsx               # 뷰 라우팅 (start → upload → lecture)
├── styles.css            # 전역 스타일
├── lib/
│   └── pdf.js            # pdf.js 워커 초기화
└── components/
    ├── Icon.jsx          # SVG 아이콘 모음
    ├── StartScreen.jsx   # 시작 화면 (세션 코드 생성)
    ├── UploadScreen.jsx  # PDF 업로드 화면
    ├── LectureMode.jsx   # 강의 모드 (메인)
    ├── PageStage.jsx     # PDF + 드로잉 캔버스
    ├── ThumbList.jsx     # 좌측 썸네일 사이드바
    └── Toolbar.jsx       # 하단 플로팅 툴바
```

## 서버 연동 포인트 (TODO)

README에 적힌 Java 서버 연동을 위한 hook 위치:

- `UploadScreen.jsx` — PDF 업로드 완료 후 서버 전송 (`handleFile` 내부)
- `LectureMode.jsx` — 페이지 전환 시 서버로 인덱스 전송 (`setCurrentPage` 호출부)
- `PageStage.jsx` — 스트로크 데이터 동기화 (`onStrokesChange`)
