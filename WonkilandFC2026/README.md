# 원기랜드의 FC 2026 · WONKILAND FC 2026
**1930–2026 WORLD FOOTBALL ALL STARS** · 대회 개최자: 장원기

역대 월드컵(1930–2026) 국가대표 선수들이 등장하는 11대11 축구 게임 프로젝트입니다.
기존 상용 축구 게임의 에셋·코드·디자인을 복제하지 않은 독자 제작물입니다.

> 이 폴더는 **완전히 별도의 프로젝트**입니다. 같은 저장소의 다른 폴더(`drive-version/`, `wonkiland-download/`)는 수정하지 않았습니다.
> 요청서에 언급된 "원기랜드의 파이터즈 2026" 프로젝트는 이 저장소에 없으며, 따라서 건드린 적도 없습니다.

## 지금 바로 실행 (Windows)
1. `Run_Prototype.bat` 더블클릭 (또는 `Prototype/index.html`을 Chrome/Edge로 열기)
2. **▶ 테스트 경기: 1930 결승 우루과이 vs 아르헨티나** → 경기 시작
3. 조작: WASD/방향키 이동 · J 패스 · K 슈팅(누르고 있으면 파워) · L 스루패스 · I 로빙/크로스 · Shift 질주 · U 선수 전환 · O 감아차기 · Esc 일시정지 · 게임패드 지원

설치 불필요 · 인터넷 불필요(라이브러리 포함) · 그래픽카드가 약하면 설정에서 그래픽 품질 "낮음".

## v0.3: 실사풍 그래픽 1단계
부드러운 인체 모델·얼굴·헤어, 실제 등번호와 이름, 시대별 공과 유니폼, 지붕 있는 경기장, 대기 산란 하늘, 그림자·빛 번짐·주변광 차폐.
PC가 느리면 **설정 → 그래픽 품질**을 "중간" 또는 "낮음"으로. (최신 FC 수준 실사는 UE5 단계 목표)

## v0.2: 역대 월드컵 선수 전원 + 드림팀
- **1930–2022 월드컵 등록 선수 10,973명**(실제 인물 8,482명, 후보 포함, 연도별 별도 버전) — 출처: [Fjelstul World Cup Database](https://github.com/jfjelstul/worldcup) (CC-BY-SA 4.0, `Data/LICENSE-DATA.md`)
- **★ 드림팀 만들기**: 국적·시대 상관없이 선수 검색 → 포메이션에 배치 → 저장 → 경기
- **역대 월드컵 경기 재현**: 실제 964경기 중 선택, 실제 선발(1970~)과 당시 규칙으로 플레이 후 실제 결과와 비교
- 시대 초월 대전, 국가별 역대 올스타, 도장깨기(역대 우승팀 22개 격파)
- 능력치는 실제 기록으로 계산한 **추정치**입니다. 2026년 대회 선수는 아직 없습니다.

## 현재 단계: 플레이 가능한 3D 프로토타입
**실사형 그래픽이 아닙니다.** 게임 시스템(물리·규칙·AI·데이터 구조)을 먼저 검증하기 위한 저폴리 3D 프로토타입이며,
최종 실사 그래픽은 Unreal Engine 5 단계에서 제작합니다. 무엇이 되고 무엇이 안 되는지는 **[docs/STATUS.md](docs/STATUS.md)** 에 정직하게 정리했습니다.

## 폴더 구조
```
WonkilandFC2026/
├─ Prototype/        플레이 가능한 3D 프로토타입 (three.js, 브라우저 실행)
│  └─ js/            physics(공 물리) · match(경기 엔진/AI/규칙) · models(공통 인체 리그/개최자/경기장)
│                    input(키보드·게임패드) · audio(효과음·음악) · commentary(해설) · main(화면/연출)
├─ Data/             게임 데이터 원본(JSON) — 프로토타입과 UE5가 함께 사용
│  ├─ sources/       원본 데이터베이스 CSV (수정 금지)
│  ├─ players/<연도>/ 선수 버전 데이터 (자동 생성, 팀별 1파일)
│  ├─ tournaments/   대회·경기·득점 (자동 생성)
│  ├─ curated/       수작업 보정값 (한글 이름 등)
│  ├─ nations/ rules/ stadiums/ host/ schema/
├─ Assets/           3D 모델·애니메이션·유니폼·경기장·음악·효과음 (분야별 별도 폴더)
├─ UnrealProject/    UE5 C++ 프로젝트 골격 (Windows에서 열기 — 아직 컴파일 미검증)
├─ Tools/            데이터 빌드/검증, 재생목록 생성, 백업 스크립트
├─ Tests/            물리 단위테스트, 경기 시뮬레이션 테스트, 브라우저 E2E 테스트
├─ Backups/          단계별 압축 백업 위치
└─ docs/             환경 점검, UE5 설치 안내, 진행 상황, 변경 기록, 권리 관리, 설계 문서
```

## 데이터 추가 방법 (확장 구조)
새 대회/국가 추가 시 시스템을 다시 만들 필요 없이 **데이터만 추가**합니다.
1. `Data/players/<연도>/<팀>.json` 작성 (형식: [docs/DATA_SPEC.md](docs/DATA_SPEC.md))
2. `Data/tournaments/<연도>.json`, `Data/kits/<연도>/`, `Data/teams/<연도>/` 추가
3. `node Tools/build_data.js` → 검증 + `Prototype/js/data_bundle.js` 재생성

원본 데이터베이스 갱신: `Data/sources/fjelstul/*.csv` 교체 → `node Tools/import_fjelstul.js` → `node Tools/build_data.js`.
한글 이름·능력치 보정은 `Data/curated/*.json` (편집 모드에서 내보내기 가능).

## 테스트
`Run_Tests.bat` 또는 `node Tests/run_all.js` (Node.js 18+). 자세한 결과는 [docs/CHANGELOG.md](docs/CHANGELOG.md).

## 문서
- [docs/ENVIRONMENT_CHECK.md](docs/ENVIRONMENT_CHECK.md) — 개발 환경 / UE5 설치 여부 점검 결과
- [docs/UE5_INSTALL_GUIDE.md](docs/UE5_INSTALL_GUIDE.md) — Windows에 UE5 설치 및 프로젝트 여는 방법
- [docs/STATUS.md](docs/STATUS.md) — 요구사항별 구현 현황 (완료/일부/미구현)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 시스템 설계
- [docs/HOST_CHARACTER.md](docs/HOST_CHARACTER.md) — 개최자 장원기 캐릭터 설계
- [docs/RIGHTS_REGISTER.md](docs/RIGHTS_REGISTER.md) — 초상·유니폼·로고·음원 사용 권리 관리
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — 단계별 변경 기록
