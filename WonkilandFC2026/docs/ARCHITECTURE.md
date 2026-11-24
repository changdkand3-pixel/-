# 시스템 설계

## 계층 구조 (확장성: 선수/국가 추가 = 데이터 추가)
```
Data/*.json ──(Tools/build_data.js 검증)──► 데이터 번들
      │                                          │
      ▼                                          ▼
UE5: UWFCDataSubsystem                   Prototype: window.WFC_DATA
      │                                          │
 ┌────┴───────────── 공통 개념 ────────────────────┴─────┐
 │ 공 물리 (physics.js / FWFCBallPhysics)  — 렌더링 독립, 결정적 │
 │ 경기 엔진 (match.js)  — 규칙·AI·통계, 렌더링 독립          │
 │ 공통 인체 리그 (models.js buildHumanoid) — 모든 선수/개최자 공유│
 │ 애니메이션 상태 → 관절 목표 자세 → 블렌딩                  │
 └──────────────────────────────────────────────────────┘
      │
 렌더링/화면 (main.js): 카메라, HUD, 연출 시퀀스, 리플레이
```

## 핵심 설계 결정
| 결정 | 이유 |
|---|---|
| 경기 엔진을 렌더링과 분리 | Node에서 전체 경기를 헤드리스로 시뮬레이션·테스트 가능. UE5 이식 시 로직 그대로 옮김 |
| 자체 결정적 공 물리 (엔진 물리 미사용) | 리플레이, 향후 온라인 대전 동기화, 테스트 재현성 |
| 고정 시간 간격 서브스텝 (1/60 s) | 저사양 PC에서도 경기 속도 = 실제 시간 |
| 선수 "버전" 모델 (`version_id` / `person_id`) | 같은 선수의 연도별 능력치·외형 분리 + 동일인 연결 |
| 규칙 프로필 데이터화 | 1930 규칙 / 현대 규칙 / 이후 연도별 규칙을 코드 수정 없이 추가 |
| 공통 리그 + 데이터 기반 외형 | 수천 명 선수를 메시 1벌 + 파라미터(키, 체격, 피부, 헤어, 킷)로 생성 |
| 확인 상태 필드 | 역사 정보 임의 생성 방지 — 검증 스크립트가 강제 |

## 경기 엔진 주요 구성 (`Prototype/js/match.js`)
- **Phase**: pre → kickoff → play ↔ setpiece → goal → halftime → … → fulltime (+ shootout)
- **선수 상태**: idle/walk/run + 동작 상태(kick, header, volley, bicycle, slide, tackle, fall, getup, gk_dive, gk_punch, throw, celebrate…)
- **AI**: 포메이션 홈 위치(공 위치/점유/성향/오프사이드 라인 반영) · 공 도달 시간 기반 압박자 선정 · 볼 소유 시 슈팅/크로스/패스/드리블 의사결정 · 패스 경로 열림 평가
- **골키퍼 AI**: 각도 좁히기 위치선정, 궤적 예측 다이빙, 일대일 전진, PK 방향 예측(읽을 확률 = 능력치)
- **규칙**: 오프사이드(킥 순간 판정, 시대별 동일선상 처리), 아웃 판정(스로인/코너/골킥), 파울→프리킥/PK, 카드, 부상, 추가시간, 연장, 승부차기/재경기

## UE5 이식 계획
| 프로토타입 | UE5 대응 | 현재 |
|---|---|---|
| physics.js | `FWFCBallPhysics` / `AWFCBall` | 코드 작성(미컴파일) |
| 데이터 번들 | `UWFCDataSubsystem` | 코드 작성(미컴파일) |
| match.js | `UWFCMatchSubsystem` + `AWFCPlayerPawn` + AIController | 미착수 |
| models.js 리그 | MetaHuman + Mannequin 리타깃 + Motion Matching | 미착수 |
| main.js 연출 | Level Sequencer + UMG | 미착수 |
