# 원기랜드 수정본 다운로드

아래 세 파일을 각각 열고 **Download raw file(다운로드)** 버튼을 눌러 모두 같은 폴더에 저장하세요. 파일 이름은 변경하지 마세요.

- [첫 번째 파일 (20MB)](wonkiland_fixed.zip.001)
- [두 번째 파일 (20MB)](wonkiland_fixed.zip.002)
- [세 번째 파일 (약 15.8MB)](wonkiland_fixed.zip.003)

Windows에서 해당 폴더를 열고 주소창에 `cmd`를 입력해 실행한 뒤 다음 명령을 입력하세요.

```bat
copy /b wonkiland_fixed.zip.001+wonkiland_fixed.zip.002+wonkiland_fixed.zip.003 wonkiland_fixed.zip
```

macOS/Linux에서는 해당 폴더에서 다음 명령을 실행하세요.

```sh
cat wonkiland_fixed.zip.001 wonkiland_fixed.zip.002 wonkiland_fixed.zip.003 > wonkiland_fixed.zip
```

생성된 `wonkiland_fixed.zip`을 압축 해제한 후 `wonkiland_fixed.html`을 사용하세요. ZIP에는 변경 내역과 검사 결과도 포함되어 있습니다. 기존 원본 HTML은 교체하기 전에 따로 보관하세요.

비공개 테스트 비밀번호는 **5283**입니다.

수정 대상 버튼 이벤트 중복과 새 JavaScript 오류는 없음을 데스크톱·모바일 Chromium에서 확인했습니다. 원본에 있던 회원 수강과목 `cloneNode` 오류는 회원관리 변경 금지 요청에 따라 보존했습니다. 자세한 내용은 [변경 내역](변경내역.md)을 참고하세요.
