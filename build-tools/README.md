# 원기랜드 만들기 도구

최신 원기랜드 HTML은 **원본(49차) 파일에 고칠 내용을 차례로 덧입혀서** 만듭니다. 이 폴더만 있으면 새 세션에서도 똑같은 파일을 다시 만들 수 있습니다.

## 다시 만들기

저장소 맨 위 폴더에서:

```bash
python3 build-tools/patch.py build-tools/base/wonkiland_original_49.html build-tools/assets/world_final.webp 결과.html build-tools/final.html
```

`ok`가 나오면 완성입니다. (55차 기준으로 `wonkiland-v55/wonkiland_v55.html`과 똑같은 파일이 나옵니다.)

## 나눠서 배포하기 (56차부터)

```bash
python3 build-tools/split.py 결과.html 배포폴더 wonkiland_vNN.html
```

`배포폴더`에 작은 HTML(약 6MB)과 `images/`, `music/` 폴더가 생깁니다. 셋을 Neocities의 **같은 폴더**에 올리면 됩니다. 8KB보다 작은 그림(아이콘 등)과 수학 초1-1·1-2 문제 그림(코드 안에 다른 형식으로 들어 있음)은 HTML에 그대로 남습니다. 55차로 시험한 결과: HTML 30.4MB → 6.0MB, images 312개(13.8MB), music 40개(4.4MB), 모든 자동 시험 통과.

## 폴더 안내

| 위치 | 내용 |
|---|---|
| `base/wonkiland_original_49.html` | 처음 받은 49차 원본. 직접 고치지 않습니다. |
| `patch.py` | 원본에 고칠 내용을 차례로 적용하는 프로그램 (50차~55차 변경이 모두 들어 있음) |
| `final.html` | 맨 끝에 붙는 화면 설정·버튼·업데이트 카드 (`WONKI_UPDATE`에 차수와 내용) |
| `assets/world_final.webp` | 원본 지도와 합친 확장 지도 그림 |
| `assets/eng51.json` | 영어 추가 문제 (학기별 단어·문장·독해) |
| `assets/g31/math31.json` | 수학 초3-1 문제 100개(그림)·정답·단원·캐릭터 |
| `assets/g31/g31.html` | 초3-1 목차 그림·캐릭터 그림·대결판 |
| `split.py` | 큰 그림·음악을 images/, music/ 폴더 파일로 꺼내는 프로그램 |
| `tests/` | 브라우저 자동 시험 (Playwright). 예: `node build-tools/tests/t56.js $PWD/결과.html $PWD/화면` |
| `scripts/` | 그림·문제를 만들 때 쓴 참고용 프로그램 (임시 폴더 경로가 들어 있어 그대로는 실행되지 않을 수 있음) |

## 새 차수를 만들 때

1. `patch.py`에서 `# ---------- 6. final overrides` 바로 앞에 새 단계(`# ---------- 13. …`)를 추가하고 `rep("""찾을 글자""","""바꿀 글자""")`로 고칩니다. 찾을 글자는 원본에 정확히 한 번 있어야 합니다.
2. `final.html`의 `WONKI_UPDATE`를 새 차수 내용으로 바꿉니다.
3. 위 명령으로 만들고, `tests/`로 시험한 뒤 `wonkiland-vNN/`에 올립니다.
