# three.js 번들 재생성 방법

`Prototype/lib/three.bundle.js` = three.js r149 + 사용하는 부가 모듈(후처리, 하늘, 환경광, 지오메트리 유틸)을
하나의 일반 스크립트로 묶은 파일입니다. (`index.html`을 더블클릭해 `file://`로 실행해도 동작하도록)

```bash
mkdir build && cd build && npm init -y
npm install three@0.149.0 esbuild@0.19.12
cp ../Tools/vendor/three_bundle_entry.js entry.js
npx esbuild entry.js --bundle --minify --format=iife --legal-comments=none --outfile=three.bundle.js
cp three.bundle.js ../Prototype/lib/three.bundle.js
```
라이선스: three.js MIT (`Prototype/lib/three.LICENSE.txt`).
