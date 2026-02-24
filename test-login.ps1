# Script to test login
$username = "seller_clothing"
$password = "seller123"
$baseUrl = "http://localhost:3000"

Write-Host "=== Testing Login ===" -ForegroundColor Cyan
Write-Host "Username: $username" -ForegroundColor Yellow
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Check server availability
Write-Host "1. Checking server availability..." -ForegroundColor Cyan
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($connection) {
        Write-Host "   [OK] Server is available on port 3000" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Server is NOT available on port 3000" -ForegroundColor Red
        Write-Host "   Make sure backend is running: npm run start:dev" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   [FAIL] Error checking: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Try login
Write-Host "2. Attempting login..." -ForegroundColor Cyan
$body = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "   [SUCCESS] Login successful!" -ForegroundColor Green
    Write-Host "   User ID: $($response.user.id)" -ForegroundColor White
    Write-Host "   Username: $($response.user.username)" -ForegroundColor White
    Write-Host "   Role: $($response.user.role)" -ForegroundColor White
    Write-Host "   Shop ID: $($response.user.shopId)" -ForegroundColor White
    Write-Host "   Token: $($response.access_token.Substring(0, 50))..." -ForegroundColor Gray
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.Exception.Message
    
    Write-Host "   [FAIL] Login failed!" -ForegroundColor Red
    Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
    
    # Try to get error details
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        Write-Host "   Response Body: $responseBody" -ForegroundColor Yellow
        
        # Try to parse JSON
        try {
            $errorObj = $responseBody | ConvertFrom-Json
            if ($errorObj.message) {
                Write-Host "   Message: $($errorObj.message)" -ForegroundColor Red
            }
        } catch {
            # Not JSON, just output as is
        }
    } catch {
        Write-Host "   Error Details: $errorMessage" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "  - Wrong username or password" -ForegroundColor White
    Write-Host "  - User does not exist in database" -ForegroundColor White
    Write-Host "  - Password hash mismatch (check DB)" -ForegroundColor White
    Write-Host "  - User is blocked (isActive = false)" -ForegroundColor White
    Write-Host "  - Database connection problem" -ForegroundColor White
    
    exit 1
}

Write-Host ""
Write-Host "=== Test completed ===" -ForegroundColor Cyan
