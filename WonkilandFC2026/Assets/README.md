# Assets — 에셋 관리 규칙

| 폴더 | 내용 | 현재 상태 |
|---|---|---|
| `Host/reference/` | 개최자 장원기 참조 사진(사용자 제공) + 얼굴 크롭 텍스처 | 있음 |
| `Models/Common/` | 공통 인체 메시/리그 (모든 선수 공유) | 프로토타입은 코드로 생성(`Prototype/js/models.js`). UE5용 메시 없음 |
| `Models/Players/` | 선수별 얼굴/체형 에셋 (`<version_id>/`) | 없음 — 권리 확인된 사진 확보 후 제작 |
| `Models/Host/` | 개최자 3D 모델 (UE5/MetaHuman) | 없음 — `docs/HOST_CHARACTER.md` 절차 참고 |
| `Animations/` | 모션캡처/키프레임 애니메이션 | 프로토타입은 절차적 애니메이션(코드). 파일 없음 |
| `Kits/` | 시대별 유니폼 텍스처 | 프로토타입은 `Data/kits` 색상으로 생성 |
| `Stadiums/` | 경기장 모델 | 프로토타입은 절차적 생성 |
| `Music/` | 메뉴/입장/시상식 음악 → `node Tools/build_playlist.js` | 비어 있음 (권리 확보된 파일만) |
| `SFX/` | 효과음 파일 | 프로토타입은 WebAudio 합성음 사용(파일 불필요) |
| `Crowd/` | 관중 응원가/챈트 | 없음 |

모든 외부 에셋은 추가 즉시 `docs/RIGHTS_REGISTER.md`에 출처·라이선스·사용 범위를 기록한다.
