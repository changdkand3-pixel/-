# 개발 환경 점검 결과 (2026-11-24)

## 이번 작업이 실행된 환경
| 항목 | 결과 |
|---|---|
| 실행 위치 | 클라우드 컨테이너 (사용자 PC 아님) |
| OS | Linux x86_64 (Windows 아님) |
| CPU / RAM | 4코어 / 15 GB |
| GPU | **없음** (소프트웨어 렌더링만 가능) |
| Unreal Engine 5 | **설치되어 있지 않음** |
| Node.js | v22 (프로토타입 테스트에 사용) |
| Chromium + Playwright | 있음 (브라우저 자동 테스트/스크린샷에 사용) |
| 외부 웹 접근 | 일부 제한 — Wikipedia 등 역사 자료 사이트 접속 차단됨 |

## 결론
- 이 환경에는 UE5를 설치·실행할 수 없습니다. UE5 에디터는 Windows/macOS용 배포판이며, 리눅스판은 소스 빌드와 GPU가 필요합니다.
- 그래서 작업을 두 갈래로 진행했습니다.
  1. **지금 실행·검증 가능한 3D 프로토타입** (`Prototype/`) — 이 환경에서 자동 테스트 완료, Windows 브라우저에서 바로 실행.
  2. **UE5 C++ 프로젝트 골격** (`UnrealProject/`) — 사용자 Windows PC에서 UE5 설치 후 열 수 있도록 준비. **이 환경에서는 컴파일 검증 불가.**
- 사용자 Windows PC의 UE5 설치 여부는 이 환경에서 확인할 수 없습니다. 아래 방법으로 직접 확인해 주세요.

## 사용자 PC에서 UE5 설치 여부 확인하는 법
1. **Epic Games Launcher** 실행 → 왼쪽 **Unreal Engine** → **라이브러리** 탭 → "엔진 버전" 목록에 5.x가 있으면 설치됨.
2. 또는 탐색기에서 `C:\Program Files\Epic Games\UE_5.*` 폴더 존재 여부 확인.
3. PowerShell: `Get-ChildItem "C:\Program Files\Epic Games" -Filter "UE_5*"`

설치되어 있지 않다면 [UE5_INSTALL_GUIDE.md](UE5_INSTALL_GUIDE.md)를 따라 설치합니다.

## 프로토타입 실행 요구사항 (Windows)
- Chrome 또는 Edge 최신판 (WebGL 2 지원)
- 게임패드: Xbox/PlayStation 패드 또는 표준 조이스틱 (브라우저 Gamepad API). 연결 후 버튼을 한 번 눌러야 인식됩니다.
