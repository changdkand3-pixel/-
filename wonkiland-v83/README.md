# 원기랜드 83차 — 삭제한 회원이 동기화 뒤 다시 돌아오던 문제

## 원인

상상코칭 회원을 **삭제하면 이 기기 목록에서만 빠지고, "지웠다"는 기록이 없었습니다.** 동기화는 "서버에 있는 회원 + 이 기기에만 있는 회원"을 합치기만 해서,
1. 서버에 그대로 남아 있던 회원이 다시 내려왔고,
2. 서버에서 지워져도 다른 기기에 남아 있던 회원이 다시 올라갔습니다.

(일반회원 삭제는 예전부터 삭제 표시가 남아서 이 문제가 없습니다.)

## 해야 할 일 3가지

### 1. 서버 코드 바꾸기

**[Code.gs(서버에 붙여넣기).txt](https://github.com/changdkand3-pixel/-/raw/claude/adoring-darwin-mewhr1/wonkiland-v83/Code.gs(%EC%84%9C%EB%B2%84%EC%97%90%20%EB%B6%99%EC%97%AC%EB%84%A3%EA%B8%B0).txt)** → **[10월 30일 "제목 없는 프로젝트"](https://script.google.com/d/1PQaf8fdRq8G838KeiqII1kHgTSn6NDYEbTqu-12xqnNfLAEneH2GAFUF/edit)** 의 `Code.gs`에 통째로 붙여넣고 저장(`CloudSync.gs`는 그대로) → **배포 관리 → 연필(수정) → 새 버전 → 배포**.

80차(6시간 로그인)까지 모두 들어 있습니다.

### 2. HTML 올리기 (새 그림 없음 → HTML 하나만 올리면 됨)

**[웰컴투 원기랜드.html](https://github.com/changdkand3-pixel/-/raw/claude/adoring-darwin-mewhr1/wonkiland-v83/%EC%9B%B0%EC%BB%B4%ED%88%AC%20%EC%9B%90%EA%B8%B0%EB%9E%9C%EB%93%9C.html)** → **`드래곤볼 수학게임` 폴더**에 `웰컴투 원기랜드.html` 이름 그대로 덮어 올립니다.

그림까지 한 번에 받기: [wonkiland_v83_neocities.zip](https://github.com/changdkand3-pixel/-/raw/claude/adoring-darwin-mewhr1/wonkiland-v83/wonkiland_v83_neocities.zip). **이번에 새로 생긴 그림 파일:** 없음

### 3. 지울 회원 다시 지우고 동기화

83차를 올린 뒤 회원관리에서 지울 회원을 **삭제** → **☁ 전체 동기화**를 한 번 누릅니다. 이제 다시 돌아오지 않습니다.

## 바뀐 점 (82차 → 83차)

1. 회원을 삭제하면 이 기기가 **"삭제한 회원"으로 기억**하고, 다음 동기화 때 **서버에서도 지웁니다.** 삭제하면 "🗑 삭제됨 · 다음 동기화 때 클라우드에서도 지워져요"가 보입니다.
2. 서버는 지운 회원을 새 시트 **"삭제된회원"**에 원본 자료와 함께 옮겨 둡니다. 실수로 지웠을 때 이 시트에서 되살릴 수 있습니다.
3. 서버에서 지워진 회원은 **다른 기기에 남아 있어도 다시 올라가지 않고**, 그 기기에서도 동기화할 때 목록에서 빠집니다.
4. 83차 업데이트 안내 카드 (주인장 기기에서만 보임).
