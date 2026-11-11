# Demo Task 10 qua API. Chạy: powershell -ExecutionPolicy Bypass -File .\scripts\demo-api.ps1
# Yêu cầu: ứng dụng đang chạy (docker compose up), backend tại http://localhost:3001
$ErrorActionPreference = "Stop"
$base = "http://localhost:3001"
$run  = Get-Date -Format "HHmmss"          # đảm bảo email và key không trùng giữa các lần chạy
$json = "application/json"

function Show-Error($ex) {
  if ($ex.ErrorDetails -and $ex.ErrorDetails.Message) { $ex.ErrorDetails.Message } else { $ex.Exception.Message }
}

Write-Host "`n=== Bước 0: đăng ký tài khoản demo ===" -ForegroundColor Cyan
$email = "demo$run@sgu.vn"
$reg   = Invoke-RestMethod -Method Post "$base/auth/register" -ContentType $json -Body (@{ email = $email; password = "secret123"; name = "Demo" } | ConvertTo-Json)
$auth  = @{ Authorization = "Bearer $($reg.accessToken)" }
Write-Host "Đã đăng ký $($reg.user.email), role = $($reg.user.role)"

Write-Host "`n=== Bước 1: tạo đơn 2 lần cùng Idempotency-Key ===" -ForegroundColor Cyan
$body = '{"items":[{"productId":1,"size":"M","qty":1}]}'
$h    = $auth + @{ "Idempotency-Key" = "order-$run" }
$o1   = Invoke-RestMethod -Method Post "$base/orders" -Headers $h -ContentType $json -Body $body
$o2   = Invoke-RestMethod -Method Post "$base/orders" -Headers $h -ContentType $json -Body $body
Write-Host "Mã đơn lần 1 = $($o1.id), lần 2 = $($o2.id)  (phải bằng nhau)"

Write-Host "`n=== Bước 2: thanh toán 2 lần cùng Idempotency-Key ===" -ForegroundColor Cyan
$pay = $auth + @{ "Idempotency-Key" = "pay-$run" }
$pb  = '{"orderId":' + $o1.id + ',"method":"WALLET"}'
$p1  = Invoke-RestMethod -Method Post "$base/payments" -Headers $pay -ContentType $json -Body $pb
$p2  = Invoke-RestMethod -Method Post "$base/payments" -Headers $pay -ContentType $json -Body $pb
Write-Host "Lần 1 replayed = $($p1.replayed), lần 2 replayed = $($p2.replayed)  (False rồi True)"
Write-Host "Payment id lần 1 = $($p1.payment.id), lần 2 = $($p2.payment.id)  (phải bằng nhau)"
Write-Host "Trạng thái đơn = $($p1.order.status)  (PAID)"

Write-Host "`n=== Bước 3: state machine (nhân viên) ===" -ForegroundColor Cyan
$st = Invoke-RestMethod -Method Post "$base/auth/login" -ContentType $json -Body '{"email":"staff@brewlite.local","password":"staff123"}'
$sh = @{ Authorization = "Bearer $($st.accessToken)" }
Write-Host "Thử PAID -> READY (sai thứ tự), mong đợi 409 INVALID_TRANSITION:"
try {
  Invoke-RestMethod -Method Patch "$base/orders/$($o1.id)/status" -Headers $sh -ContentType $json -Body '{"status":"READY"}' | Out-Null
  Write-Host "BẤT NGỜ: không bị chặn!" -ForegroundColor Red
} catch { Show-Error $_ }
Write-Host "Đi đúng thứ tự:"
$r = Invoke-RestMethod -Method Patch "$base/orders/$($o1.id)/status" -Headers $sh -ContentType $json -Body '{"status":"PREPARING"}'
Write-Host "  -> $($r.status)"
$r = Invoke-RestMethod -Method Patch "$base/orders/$($o1.id)/status" -Headers $sh -ContentType $json -Body '{"status":"READY"}'
Write-Host "  -> $($r.status)"
Write-Host "`nXong. Tồn kho đồng thời: chạy trong thư mục backend:  npx jest --runInBand --testPathPattern=e2e -t `"Task 10.3`"" -ForegroundColor Green
