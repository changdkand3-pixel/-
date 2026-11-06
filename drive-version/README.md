# Google Drive 연결 준비본 — 폴더·웹앱 주소 설정 완료

## 지금 Neocities에 올릴 최종 파일

사용자가 제공한 Drive 폴더 ID와 별도 Apps Script `/exec` 주소를 설정했습니다. 아래 **두 파일을 다시 다운로드**해 Neocities의 **같은 작업장 폴더**에 올리세요. GitHub 파일 페이지에서 **Download raw file**을 누르면 됩니다.

1. [wonkiland_drive.html](wonkiland_drive.html) — 약 5.3MB
2. [wonkiland-drive-config.js](wonkiland-drive-config.js) — 배포 주소가 이미 입력된 설정 파일

Neocities에서 **wonkiland_drive.html**을 열면 이미지 준비 진행률이 표시됩니다. `wonkiland_assets` 이미지 폴더를 Neocities에 올릴 필요는 없습니다. Drive에는 77개 자료가 들어 있어야 합니다. 기존 정상 파일은 실제 연결 확인 전까지 보관하세요.

## 현재 실제 연결 진단: 배포는 정상 응답, 자료 배치가 다름

`doGet` 누락은 해결됐습니다. 현재 웹앱은 **Asset not found**를 반환합니다. 제공된 `드래곤볼 수학문제` 폴더 안에는 `이미지파일`, `음악파일`, `난이도 중` 하위 폴더가 있고, 이미지·음악 파일명은 `KakaoTalk...`, `music_01...` 등입니다. 현재 웹앱은 아래 전용 ZIP에 들어 있는 이름의 자료 **77개가 설정된 폴더에 직접** 들어 있어야 동작합니다.

1. 아래 자료 ZIP 분할 파일 **4개**를 받아 합친 뒤 압축을 풉니다.
2. PC에서 압축을 푼 **drive-assets 폴더 안으로 들어가 파일 77개를 모두 선택**합니다.
3. [현재 연결된 드래곤볼 수학문제 폴더](https://drive.google.com/drive/folders/10dbk7-IOghD-lpEfT5__ZrboHEQ87j5C)를 열고, 선택한 **파일 77개를 이 위치에 직접 업로드**합니다.
4. 업로드 완료를 알려 주시면 대표 이미지·음악의 실제 응답을 다시 확인하겠습니다. 현재 Apps Script 배포 주소와 Neocities 파일 설정은 그대로 사용할 수 있습니다.

파일명은 `46a16a...png`처럼 긴 영문·숫자로 된 이름이어야 합니다. 기존 원본 폴더나 파일을 삭제할 필요는 없습니다.

---

아래는 이미 완료한 Drive 업로드·배포 절차를 포함한 참고 설명입니다.

게임 이미지 52개와 음악 25곡을 Drive에서 받아 브라우저에 캐시합니다. Neocities에는 약 5.3MB HTML과 작은 설정 파일만 올립니다. 음악은 재생할 때 해당 곡을 받습니다.

**현재 로컬 중계 시뮬레이터만 검증했습니다. 실제 Google Apps Script 배포·권한·속도는 아직 확인하지 못했습니다. 기존 회원관리/동기화 프로젝트는 변경하지 않습니다. 기존 v7 다운로드도 별도 폴더에 유지됩니다.**

## 1. 드라이브에 자료 넣기

아래 네 파일을 각각 열고 **Download raw file**로 같은 PC 폴더에 저장하세요.

- [자료 ZIP 1 (24MB)](wonkiland_drive_assets.zip.001)
- [자료 ZIP 2 (24MB)](wonkiland_drive_assets.zip.002)
- [자료 ZIP 3 (24MB)](wonkiland_drive_assets.zip.003)
- [자료 ZIP 4 (약 9.8MB)](wonkiland_drive_assets.zip.004)

Windows cmd:

```bat
copy /b wonkiland_drive_assets.zip.001+wonkiland_drive_assets.zip.002+wonkiland_drive_assets.zip.003+wonkiland_drive_assets.zip.004 wonkiland_drive_assets.zip
```

macOS/Linux:

```sh
cat wonkiland_drive_assets.zip.001 wonkiland_drive_assets.zip.002 wonkiland_drive_assets.zip.003 wonkiland_drive_assets.zip.004 > wonkiland_drive_assets.zip
```

ZIP을 풀고 나오는 **drive-assets 폴더 안의 파일 77개를 선택하여 현재 연결된 Drive 폴더에 직접 업로드**하세요. 파일 이름을 그대로 유지하세요. 이 폴더 안에는 이미지와 음악 총 **77개 파일**이 직접 있어야 합니다.

**제공된 폴더 ID를 Code.gs에 설정했습니다:** `10dbk7-IOghD-lpEfT5__ZrboHEQ87j5C`. 이 폴더 안에 77개 파일이 직접 들어 있어야 합니다. 폴더 자체를 공개로 바꿀 필요는 없습니다. 웹앱을 배포하는 Google 계정이 이 폴더를 읽을 수 있어야 합니다.

## 2. 별도 Apps Script 프로젝트 배포

1. https://script.google.com/ 에서 **새 프로젝트**를 만드세요. 기존 회원관리·Google Sheets 동기화 코드를 덮어쓰지 마세요.
2. [Code.gs](Code.gs)의 코드를 새 프로젝트의 Code.gs에 넣으세요.
3. **Code.gs에는 제공된 폴더 ID가 이미 설정되어 있습니다.** 폴더 ID는 바꾸지 않아도 됩니다. 해당 폴더 안에 77개 파일이 직접 있어야 합니다.
4. 프로젝트 설정에서 appsscript.json 표시를 켜고 [appsscript.json](appsscript.json)을 넣으면 Drive 읽기 전용 권한으로 범위를 제한할 수 있습니다.
5. **배포 → 새 배포 → 웹 앱**, 실행 사용자는 **본인**, 액세스 권한은 **모든 사용자(로그인 없이)**로 설정합니다. 본인 Google 계정에서 필요한 읽기 권한을 승인합니다.
6. 배포 URL(`https://script.google.com/macros/s/.../exec`)을 복사해 채팅에 보내 주세요. `/dev` 테스트 주소가 아닙니다. 비밀번호나 인증키는 보내지 마세요.

이 웹앱은 설정된 폴더의 정해진 형식의 자료 파일만 읽으며 수정·삭제 기능은 없습니다. 배포한 웹앱은 게임 자료를 공개 웹사이트에 제공하는 용도입니다. 계정 정책에서 익명 액세스를 허용하지 않으면 이 방식의 연결이 막힐 수 있습니다.

## 3. Neocities에 두 파일 업로드

- [wonkiland_drive.html](wonkiland_drive.html)
- [wonkiland-drive-config.js](wonkiland-drive-config.js)

설정 파일에는 제공된 `/exec` URL이 이미 입력되어 있습니다. 이 배포 주소는 공개 주소이며 비밀번호가 아닙니다. 수정하지 않고 업로드할 수 있습니다.
두 파일을 기존 작업장 폴더 안의 같은 위치에 올리고 `wonkiland_drive` 주소를 여세요. 이미지 폴더를 Neocities에 올릴 필요는 없습니다.

## 실제 연결 후 확인할 사항

첫 방문은 약 37.5MB의 이미지를 받아 시간이 걸립니다. 이후에는 브라우저 캐시를 재사용합니다. 음악은 약 45MB 전체를 한 번에 받지 않고 필요한 곡만 받아 재생합니다. Apps Script/Drive의 속도·호출 한도와 브라우저 정책에 따라 실제 대기 시간이 달라질 수 있습니다. 실제 Google 연결을 확인하기 전에는 기존 작동 파일을 보관하세요.

## 로컬에서 확인한 범위

PC·모바일 Chromium에서 이미지 52개를 중계로 받는 첫 로딩, 재방문 이미지 요청 0회, 음악 한 곡의 필요 시 로딩·재생·일시정지·음량 조절, 비밀번호 5283 및 초1-2의 23개 이미지·6개 단원 대결을 확인했습니다. 변조된 자료는 해시 검사로 거부했습니다. 별도 Apps Script 핸들러는 Drive API 모의 객체로 정상 응답·잘못된 파일명 거부를 검사했습니다. 실제 Google 서비스의 배포 성공을 뜻하지 않습니다.

회원관리/동기화/방명록/가구 배치와 게임 규칙은 유지되며, 원본 회원 수강과목 cloneNode 오류도 그대로입니다.

[로컬 검증 결과](local-validation.json)
