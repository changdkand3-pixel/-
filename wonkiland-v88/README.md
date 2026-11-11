# 원기랜드 88차 — 숙제·성적 창이 회원관리 창 뒤에 가려지던 문제

## 올리는 방법 (HTML 하나만 올리면 됨)

**[웰컴투 원기랜드.html](https://github.com/changdkand3-pixel/-/raw/claude/adoring-darwin-mewhr1/wonkiland-v88/%EC%9B%B0%EC%BB%B4%ED%88%AC%20%EC%9B%90%EA%B8%B0%EB%9E%9C%EB%93%9C.html)** → **`드래곤볼 수학게임` 폴더**에 `웰컴투 원기랜드.html` 이름 그대로 덮어 올립니다.

그림까지 한 번에 받기: [wonkiland_v88_neocities.zip](https://github.com/changdkand3-pixel/-/raw/claude/adoring-darwin-mewhr1/wonkiland-v88/wonkiland_v88_neocities.zip). **이번에 새로 생긴 그림 파일:** 없음 · **서버 코드:** 바꿀 것 없음

## 원인

회원관리 창은 열리면 아주 위쪽 층(999990)에 그려지도록 되어 있는데, **숙제·성적 창은 그보다 아래 층(95)**이라 열려도 회원관리 창 뒤에 가려졌습니다.

## 바뀐 점 (87차 → 88차)

회원관리 창에서 여는 창들을 모두 회원관리 창 **위로** 올렸습니다.
- 📚 숙제·성적 관리
- 본인 정보 보기, 관리자 비밀번호 변경
- 🏠 내 집 꾸미기, 일반회원 명단

(수정·신규 등록·비밀번호 확인 창은 원래 위에 잘 떴습니다.) 88차 업데이트 안내 카드는 주인장 기기에서만 보입니다.
