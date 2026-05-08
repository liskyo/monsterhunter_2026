@echo off
title Monster Hunter 2026 Dev Server
color 0b

:: 確保指令在檔案所在的資料夾執行
cd /d "%~dp0"

echo =======================================================
echo         [魔物獵人：2026] iPhone 16 開發環境
echo =======================================================
echo.

:: 1. 檢查 node_modules 是否存在，若無則自動安裝
if not exist node_modules (
    echo [!] 偵測到尚未安裝依賴包，正在執行 npm install...
    call npm install
) else (
    echo [OK] 依賴包已就緒。
)

:: 2. 自動開啟預設瀏覽器到 Vite 的預設通訊埠
:: 如果你的通訊埠有改過，請調整下方的 5173
echo [>] 正在準備開啟瀏覽器預覽 (http://localhost:5173)...
start http://localhost:5173

echo [>] 正在啟動 Vite 開發伺服器...
echo.
echo =======================================================
echo    提示：若要停止伺服器，請直接關閉此視窗或按 Ctrl+C
echo =======================================================
echo.

:: 3. 執行開發指令
npm run dev

pause