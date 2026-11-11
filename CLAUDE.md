# 원기랜드 작업 규칙

- 사용자에게 보내는 설명과 진행 상황은 한국어로 씁니다.
- 원기랜드 HTML을 업데이트할 때마다 **업데이트 카드**를 반드시 함께 넣습니다.
  - 형식: `<aside id="wonkiNNUpdate">` (NN = 차수). 화면 오른쪽 아래 고정, 노란 테두리 카드, 빨간 × 닫기 버튼, 제목 "🎡 원기랜드 NN차 업데이트", 바뀐 점을 이모지 한 줄씩.
  - 15초 뒤 자동으로 사라지게 `setTimeout`을 붙입니다.
  - 예전 차수 카드는 CSS `display:none!important`로 숨겨 최신 카드 한 장만 보이게 합니다.
  - 예시는 `wonkiland-v50/wonkiland_v50.html`의 `wonki50Update`를 참고합니다.
- 새 차수는 `wonkiland-vNN/` 폴더에 HTML과 README.md(바뀐 점, 다운로드 링크)를 넣고, 루트 README.md의 다운로드 링크를 최신 차수로 바꿉니다.
