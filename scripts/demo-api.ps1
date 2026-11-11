# Demo Task 10 qua API (file chi dung ky tu ASCII de tranh loi ma hoa tren Windows PowerShell 5.1)
# Chay: powershell -ExecutionPolicy Bypass -File .\scripts\demo-api.ps1
# Yeu cau: ung dung dang chay (docker compose up), backend tai http://localhost:3001
$ErrorActionPreference = "Stop"
$base = "http://localhost:3001"
$run  = Get-Date -Format "HHmmss"
$json = "application/json"

function Show-Error($ex) {
  if ($ex.ErrorDetails -and $ex.ErrorDetails.Message) { $ex.ErrorDetails.Message } else { $ex.Exception.Message }
}

Write-Host ""
Write-Host "=== Buoc 0: dang ky tai khoan demo ===" -ForegroundColor Cyan
$email = "demo$run@sgu.vn"
$regBody = @{ email = $email; password = "secret123"; name = "Demo" } | ConvertTo-Json
$reg   = Invoke-RestMethod -Method Post "$base/auth/register" -ContentType $json -Body $regBody
$auth  = @{ Authorization = "Bearer $($reg.accessToken)" }
Write-Host "Da dang ky $($reg.user.email), role = $($reg.user.role)"

Write-Host ""
Write-Host "=== Buoc 1: tao don 2 lan cung Idempotency-Key ===" -ForegroundColor Cyan
$body = '{"items":[{"productId":1,"size":"M","qty":1}]}'
$h    = $auth + @{ "Idempotency-Key" = "order-$run" }
$o1   = Invoke-RestMethod -Method Post "$base/orders" -Headers $h -ContentType $json -Body $body
$o2   = Invoke-RestMethod -Method Post "$base/orders" -Headers $h -ContentType $json -Body $body
Write-Host "Ma don lan 1 = $($o1.id), lan 2 = $($o2.id)  (phai bang nhau)"

Write-Host ""
Write-Host "=== Buoc 2: thanh toan 2 lan cung Idempotency-Key ===" -ForegroundColor Cyan
$pay = $auth + @{ "Idempotency-Key" = "pay-$run" }
$pb  = '{"orderId":' + $o1.id + ',"method":"WALLET"}'
$p1  = Invoke-RestMethod -Method Post "$base/payments" -Headers $pay -ContentType $json -Body $pb
$p2  = Invoke-RestMethod -Method Post "$base/payments" -Headers $pay -ContentType $json -Body $pb
Write-Host "Lan 1 replayed = $($p1.replayed), lan 2 replayed = $($p2.replayed)  (False roi True)"
Write-Host "Payment id lan 1 = $($p1.payment.id), lan 2 = $($p2.payment.id)  (phai bang nhau)"
Write-Host "Trang thai don = $($p1.order.status)  (PAID)"

Write-Host ""
Write-Host "=== Buoc 3: state machine (nhan vien) ===" -ForegroundColor Cyan
$loginBody = '{"email":"staff@brewlite.local","password":"staff123"}'
$st = Invoke-RestMethod -Method Post "$base/auth/login" -ContentType $json -Body $loginBody
$sh = @{ Authorization = "Bearer $($st.accessToken)" }
Write-Host "Thu PAID -> READY (sai thu tu), mong doi 409 INVALID_TRANSITION:"
try {
  Invoke-RestMethod -Method Patch "$base/orders/$($o1.id)/status" -Headers $sh -ContentType $json -Body '{"status":"READY"}' | Out-Null
  Write-Host "BAT NGO: khong bi chan!" -ForegroundColor Red
} catch { Show-Error $_ }
Write-Host "Di dung thu tu:"
$r = Invoke-RestMethod -Method Patch "$base/orders/$($o1.id)/status" -Headers $sh -ContentType $json -Body '{"status":"PREPARING"}'
Write-Host "  -> $($r.status)"
$r = Invoke-RestMethod -Method Patch "$base/orders/$($o1.id)/status" -Headers $sh -ContentType $json -Body '{"status":"READY"}'
Write-Host "  -> $($r.status)"
Write-Host ""
Write-Host "Xong. Ton kho dong thoi: chay trong thu muc backend:" -ForegroundColor Green
Write-Host '  npx jest --runInBand --testPathPattern=e2e -t "Task 10.3"' -ForegroundColor Green
