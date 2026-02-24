# Script to check API connection from different IPs
$baseUrls = @(
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.102:3000"
)

$username = "seller_clothing"
$password = "seller123"

Write-Host "=== Checking API Connection ===" -ForegroundColor Cyan
Write-Host ""

foreach ($baseUrl in $baseUrls) {
    Write-Host "Testing: $baseUrl" -ForegroundColor Yellow
    
    # Check if server is reachable
    try {
        $uri = [System.Uri]::new($baseUrl)
        $hostName = $uri.Host
        $port = $uri.Port
        
        $connection = Test-NetConnection -ComputerName $hostName -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
        
        if ($connection) {
            Write-Host "  [OK] Server is reachable" -ForegroundColor Green
            
            # Try login
            try {
                $body = @{
                    username = $username
                    password = $password
                } | ConvertTo-Json
                
                $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
                Write-Host "  [OK] Login successful" -ForegroundColor Green
                Write-Host "  User: $($response.user.username) (ID: $($response.user.id))" -ForegroundColor White
                
            } catch {
                Write-Host "  [FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    Write-Host "  Status Code: $statusCode" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "  [FAIL] Server is NOT reachable" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host "1. Find your PC's IP address: ipconfig" -ForegroundColor White
Write-Host "2. Update shop_owner/lib/config/app_config.dart with correct IP" -ForegroundColor White
Write-Host "3. Or run Flutter app with: flutter run --dart-define=API_BASE_URL=http://YOUR_IP:3000" -ForegroundColor White
Write-Host ""
