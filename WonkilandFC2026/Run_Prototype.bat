@echo off
REM 원기랜드의 FC 2026 프로토타입 실행 (기본 브라우저: Chrome / Edge 권장)
chcp 65001 >nul
start "" "%~dp0Prototype\index.html"
