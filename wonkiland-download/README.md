# 원기랜드 v8 — Neocities 업로드용

**원본 화질을 유지하면서 HTML 크기를 약 118MB → 65MB로 줄였습니다.** 이미지 폴더는 약 37.5MB(52개)이며, 전체 업로드 크기는 약 103MB입니다. 기존 음악은 HTML에 그대로 내장됩니다.

## 다운로드 (4개)

각 파일을 열고 **Download raw file** 버튼으로 네 파일 모두 같은 폴더에 저장하세요.

- [첫 번째 파일 (24MB)](wonkiland_upload_v8.zip.001)
- [두 번째 파일 (24MB)](wonkiland_upload_v8.zip.002)
- [세 번째 파일 (24MB)](wonkiland_upload_v8.zip.003)
- [네 번째 파일 (약 13.9MB)](wonkiland_upload_v8.zip.004)

Windows에서 해당 폴더 주소창에 `cmd`를 입력해 실행한 뒤:

```bat
copy /b wonkiland_upload_v8.zip.001+wonkiland_upload_v8.zip.002+wonkiland_upload_v8.zip.003+wonkiland_upload_v8.zip.004 wonkiland_upload_v8.zip
```

macOS/Linux:

```sh
cat wonkiland_upload_v8.zip.001 wonkiland_upload_v8.zip.002 wonkiland_upload_v8.zip.003 wonkiland_upload_v8.zip.004 > wonkiland_upload_v8.zip
```

## Neocities에 올리기

1. 압축을 풀면 `wonkiland_fixed_v8.html`과 `wonkiland_assets` 폴더가 나옵니다.
2. Neocities의 기존 **작업장 폴더**에서 **New Folder → wonkiland_assets**를 만들고, 그 안에 이미지 **52개**를 모두 업로드하세요.
3. 작업장 폴더로 돌아와 **wonkiland_fixed_v8.html**을 업로드하고 새 v8 주소를 여세요.

**HTML과 이미지 폴더를 모두 올려야 합니다.** 둘은 같은 작업장 위치에 있어야 합니다.

남은 저장 공간이 약 103MB보다 적으면 기존 파일을 PC에 백업한 뒤 사용하지 않는 구버전을 정리해 공간을 확보하세요. 계정의 남은 공간은 작업 환경에서 확인하지 못했으며 서버 파일을 삭제하지 않았습니다.

이미지 원본 바이트·음악·게임 규칙·저장·회원관리·동기화·방명록·가구 배치는 유지됩니다. PC·모바일에서 원본 이미지 일치와 6개 단원·23종 대결, 내장 음악 조작을 검증했습니다. 원본 cloneNode 오류는 보존했고 실제 Neocities 업로드는 검증하지 못했습니다.

[자세한 업로드 방법과 검증 범위](업로드방법.md)
