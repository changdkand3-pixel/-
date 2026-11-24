# Backups

- **1차 백업 = Git 커밋 기록.** 각 개발 단계는 커밋으로 기록되며 원격 저장소에 푸시된다.
- 2차 백업(오프라인 압축본): Windows `powershell -File Tools\backup.ps1 -Label step01`, Linux/macOS `Tools/backup.sh step01`.
- 압축본(`*.zip`, `*.tar.gz`)은 용량 때문에 Git에 올리지 않는다(.gitignore).
