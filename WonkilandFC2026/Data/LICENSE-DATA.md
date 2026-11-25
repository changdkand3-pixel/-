# 데이터 라이선스

## 선수·대회 데이터 (Data/sources, Data/players, Data/tournaments, Prototype/js/data_bundle.js)
- 출처: **The Fjelstul World Cup Database** — Joshua C. Fjelstul, Ph.D. — https://github.com/jfjelstul/worldcup
- 라이선스: **CC-BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0/)
- 이 프로젝트의 `Data/players`, `Data/tournaments`, `data_bundle.js`는 위 데이터를 가공한 **2차 저작물**이므로 동일하게 CC-BY-SA 4.0을 따릅니다.
  - 배포 시 출처 표기 필수 (게임 타이틀 화면 하단과 이 파일에 표기)
  - 이 데이터를 수정·재배포할 때도 CC-BY-SA 4.0 유지
- 원본 CSV는 `Data/sources/fjelstul/`에 수정 없이 보관합니다.

## 이 프로젝트가 추가한 값
- **능력치(ratings)**: 위 기록을 바탕으로 `Tools/import_fjelstul.js`가 계산한 **추정치**입니다. 공식 능력치가 아닙니다.
- **한글 이름·1930 결승 능력치**: `Data/curated/` — 제작팀 입력값 (일부 needs_citation)
- **국가 유니폼 색상**: `Data/nations/nations.json` — 대표 색상의 근사치 (needs_citation)

## 주의
CC-BY-SA는 **데이터**에 대한 라이선스입니다. 선수 실명·초상(퍼블리시티권), FIFA 상표 등은 별도로 검토해야 합니다 → `docs/RIGHTS_REGISTER.md`
