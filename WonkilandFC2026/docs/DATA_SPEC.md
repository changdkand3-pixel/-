# 데이터 형식 (Data/)

프로토타입과 UE5가 **같은 JSON 원본**을 읽습니다. 수정 후 `node Tools/build_data.js`로 검증합니다.

## 선수 버전 (`Data/players/<연도>/<팀>.json` → `players[]`)
동일 선수라도 **대회 연도마다 별도 레코드**(`version_id`)이고, 동일인 연결은 `person_id`로 합니다.

| 필드 | 설명 | 미확인 시 |
|---|---|---|
| `version_id` | `<팀>-<연도>-<성>` 예: `URU-1930-NASAZZI` | 필수 |
| `person_id` | 연도 무관 동일인 ID | 필수 |
| `name_ko`, `name_en` | 한글/영문 이름 | 필수 |
| `nationality`, `tournament_year`, `captain` | | |
| `birth_date`, `age_at_tournament` | 생년월일, 당시 나이 | `null` |
| `height_cm`, `weight_kg` | 신장, 체중 | `null` (프로토타입은 174 cm 플레이스홀더로 표시만) |
| `position_group`, `position_role_1930` | 시대 표기 포지션 (GK/FB/HB/FW) | |
| `shirt_number` | 등번호 | 1930은 미사용 → `null` |
| `preferred_foot` | 주발 | `null` |
| `appearance` | 얼굴 모델 ID, 헤어, 피부톤 참조 | `null` |
| `kit_ref` | `Data/kits`의 유니폼 ID | |
| `match_records[]` | 실제 경기 기록 (출전, 득점 분) | |
| `ratings` | 19개 능력치 (1~99) | 필수 |
| `ratings_meta.estimated` | **true = 추정치** (공식 기록 아님) | 필수 |
| `verification` | 항목별 확인 상태 | |

## 확인 상태 값 (`verification`)
| 값 | 의미 |
|---|---|
| `confirmed` | 출처 첨부 완료 (출처 URL/문헌은 `sources` 필드에 추가 예정) |
| `needs_citation` | 널리 알려진 사실로 입력했으나 출처 첨부 전 |
| `unknown` | 확인 안 됨 — **값은 반드시 null** (검증 스크립트가 강제) |
| `not_used_in_1930` | 해당 시대에 존재하지 않는 항목 |

## 능력치 키 (19개)
`overall, speed, acceleration, shooting, finishing, long_shots, passing, dribbling, ball_control, skill_moves, heading, defending, tackling, physical, stamina, jumping, free_kick, penalty, goalkeeping`
(종합, 스피드, 가속력, 슈팅, 골 결정력, 중거리, 패스, 드리블, 볼 컨트롤, 개인기, 헤딩, 수비, 태클, 몸싸움, 체력, 점프력, 프리킥, 페널티킥, 골키퍼)

## 기타 파일
- `tournaments/<연도>.json`: 참가국·조·경기(날짜, 경기장, 스코어, 득점, 주심, 관중, 포메이션) + 항목별 verification
- `kits/<연도>/kits.json`: 유니폼 패턴/색상 (엠블럼 없음)
- `stadiums/<id>.json`, `rules/<id>.json` (역사/현대 규칙 프로필), `host/host_character.json`

## 검증 규칙 (`Tools/build_data.js`)
필수 필드, 능력치 범위 1~99, `estimated` 플래그, verification 값, `unknown`인데 값이 있는 경우 오류, 중복 `version_id`,
유니폼/경기장 참조, 득점자가 데이터에 존재하는지, 스쿼드당 11명 이상·GK 1명 이상.
