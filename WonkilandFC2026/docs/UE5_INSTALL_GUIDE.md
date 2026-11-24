# Unreal Engine 5 설치 및 프로젝트 열기 (Windows)

## 1. 권장 PC 사양 (실사형 그래픽 개발 기준)
- Windows 10/11 64비트
- CPU 8코어 이상, RAM 32 GB 이상(64 GB 권장)
- GPU: DirectX 12 지원, VRAM 8 GB 이상 (RTX 3070급 이상 권장 — Lumen/Nanite/MetaHuman)
- SSD 여유 공간 200 GB 이상 (엔진 약 60 GB + 프로젝트/캐시)

## 2. 설치 순서
1. https://www.unrealengine.com 에서 **Epic Games Launcher** 다운로드·설치, Epic 계정 로그인.
2. 런처 → **Unreal Engine** → **라이브러리** → 엔진 버전 옆 **+** → **5.4 이상** 선택 → 설치.
   - 설치 옵션에서 "Starter Content", "Templates and Feature Packs", "Editor symbols for debugging"(선택) 체크.
3. **Visual Studio 2022 Community** 설치 (C++ 프로젝트 컴파일용, 무료)
   - 워크로드: **"C++를 사용한 게임 개발"** + **".NET 데스크톱 개발"**
   - 개별 구성 요소: Windows 10/11 SDK 최신, MSVC v143 빌드 도구
4. (선택) **MetaHuman**: 런처 → Fab/마켓에서 MetaHuman 플러그인, https://metahuman.unrealengine.com — 실사형 인물 제작용.

## 3. 이 프로젝트 열기
1. `WonkilandFC2026\UnrealProject\WonkilandFC.uproject` 우클릭 → **Generate Visual Studio project files**
2. `WonkilandFC.uproject` 더블클릭 → "모듈을 다시 빌드하시겠습니까?" → **예**
3. 빌드 오류가 나면 생성된 `WonkilandFC.sln`을 Visual Studio로 열어 **Development Editor / Win64** 로 빌드 후 오류 메시지를 알려주세요.
   - ⚠️ 이 C++ 코드는 작업 환경에 UE5가 없어 **컴파일 검증이 되지 않았습니다.** 첫 빌드에서 수정이 필요할 수 있습니다.
4. 에디터에서 새 레벨 생성 → World Settings → GameMode Override = `WFCGameMode` → 플레이 → Output Log에
   `[WFC] Loaded 2 squads ...`, `[WFC] URU 1930 vs ARG 1930 (historical_1930): loaded, players 11 / 11` 이 나오면 데이터 연동 성공.

## 4. UE5 단계에서 할 일 (프로토타입 → 실사)
1. 공통 인체 리그: MetaHuman 바디 + UE5 Mannequin 리타깃 → 모든 선수 공유
2. 애니메이션: Motion Matching(5.4+) 기반 이동/드리블, 슈팅·태클·골키퍼 다이빙 몽타주
3. 프로토타입 로직 이식: `Prototype/js/match.js`(규칙/AI) → C++ `UWFCMatchSubsystem`
4. 경기장: Nanite 메시, Lumen 조명, 군중 = Niagara/Mass 군중 시스템
5. 개최자 장원기: MetaHuman Creator / Mesh to MetaHuman(참조 사진 + 추가 촬영) → `docs/HOST_CHARACTER.md`
6. Windows 패키징: Platforms → Windows → Package Project
