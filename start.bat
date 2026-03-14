@echo off
chcp 65001 >nul
title 综测填写系统

echo ========================================
echo   综测填写系统 启动中...
echo ========================================

:: 清理旧进程
echo.
echo [1/4] 清理旧进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 :4000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: 启动后端
echo [2/4] 启动后端 (port 4000)...
start "后端" /min cmd /c "cd /d %~dp0 && npm run dev:backend"
timeout /t 3 /nobreak >nul

:: 启动前端
echo [3/4] 启动前端 (port 3000)...
start "前端" /min cmd /c "cd /d %~dp0 && npm run dev:frontend"
timeout /t 3 /nobreak >nul

:: 启动 Cloudflare Tunnel
echo [4/4] 启动 Cloudflare Tunnel...
start "隧道" /min cmd /c "cloudflared tunnel run zongce"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   全部启动完成!
echo   本地访问:  http://localhost:3000
echo   公网访问:  https://zongce.youngspace.top
echo   后端API:   http://localhost:4000
echo ========================================
echo.
echo 按任意键停止所有服务...
pause >nul

:: 停止所有服务
echo.
echo 正在停止所有服务...
taskkill /FI "WINDOWTITLE eq 后端*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq 前端*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq 隧道*" /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 :4000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
taskkill /IM cloudflared.exe /F >nul 2>&1
echo 已停止全部服务。
timeout /t 2 /nobreak >nul
