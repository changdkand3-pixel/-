@echo off
chcp 65001 >nul
REM 테스트 실행 (Node.js 18+ 필요). E2E 테스트는 추가로: npm i -D playwright ^&^& npx playwright install chromium
cd /d "%~dp0"
node Tools\build_data.js || goto :fail
node Tests\run_all.js || goto :fail
echo ALL TESTS PASSED
pause
exit /b 0
:fail
echo TEST FAILED
pause
exit /b 1
