@echo off
REM Pindah ke folder tempat .bat ini berada (folder project)
cd /d "%~dp0"

REM Cek apakah npm tersedia di PATH
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm tidak ditemukan di PATH. Pastikan Node.js sudah terinstall dan "npm" dikenali.
  echo Unduh dari https://nodejs.org/ lalu coba lagi.
  pause
  exit /b 1
)

REM Jalankan script start dari package.json
echo Menjalankan: npm run start
echo.
npm run start

REM Biarkan jendela tetap terbuka supaya log terlihat
echo.
echo [Selesai / proses dihentikan] Tekan tombol apa saja untuk menutup...
pause