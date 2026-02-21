# Скрипт для создания .env файла
# Запустите: .\create-env.ps1

if (Test-Path .env) {
    Write-Host "Файл .env уже существует!" -ForegroundColor Yellow
    $overwrite = Read-Host "Перезаписать? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Отменено." -ForegroundColor Red
        exit
    }
}

if (Test-Path .env.example) {
    Copy-Item .env.example .env
    Write-Host "Файл .env создан из .env.example" -ForegroundColor Green
    Write-Host "Не забудьте отредактировать .env и указать правильные параметры подключения к БД!" -ForegroundColor Yellow
} else {
    # Создаем .env файл с базовыми настройками
    @"
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=all_shops

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-min-32-characters
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "Файл .env создан с базовыми настройками" -ForegroundColor Green
    Write-Host "Не забудьте отредактировать .env и указать правильные параметры подключения к БД!" -ForegroundColor Yellow
}
