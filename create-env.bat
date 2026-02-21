@echo off
REM Скрипт для создания .env файла
REM Запустите: create-env.bat

if exist .env (
    echo Файл .env уже существует!
    set /p overwrite="Перезаписать? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Отменено.
        exit /b
    )
)

if exist .env.example (
    copy .env.example .env >nul
    echo Файл .env создан из .env.example
    echo Не забудьте отредактировать .env и указать правильные параметры подключения к БД!
) else (
    REM Создаем .env файл с базовыми настройками
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo DB_USERNAME=root
        echo DB_PASSWORD=
        echo DB_DATABASE=all_shops
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-secret-key-change-in-production-min-32-characters
        echo JWT_EXPIRES_IN=24h
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo NODE_ENV=development
    ) > .env
    
    echo Файл .env создан с базовыми настройками
    echo Не забудьте отредактировать .env и указать правильные параметры подключения к БД!
)

pause
