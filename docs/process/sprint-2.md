# Sprint 2

| Mục | Nội dung |
|---|---|
| Thời gian | 1 tuần · *ghi ngày thật: __/__/2026 – __/__/2026* |
| Sprint Goal | Hoàn thành luồng end-to-end, tự động hoá đóng gói và triển khai một phiên bản production truy cập được |
| Cam kết | S2-01 → S2-13, 32 SP ([backlog](product-backlog.md)) |

## Việc còn lại trước khi nghiệm thu (điền khi xong)

- [ ] Tạo repo GitHub, đẩy mã và tag; bật branch protection ([deployment.md](../deployment.md) mục 2.1)
- [ ] Tạo Blueprint Render, thêm deploy hook vào GitHub Secrets (mục 2.2)
- [ ] CD xanh trên `main`; điền URL bên dưới
- [ ] Đẩy tag `v2.0.0` → GitHub Release
- [ ] Chụp minh chứng CI đỏ/xanh, CD, rollback vào `docs/evidence/`
- [ ] Quay video demo end-to-end trên URL production

| Thông tin bàn giao | Giá trị |
|---|---|
| Repository | https://github.com/kaiqwwp/brewlite |
| Web production | *https://….onrender.com* |
| API production | *https://….onrender.com* · health: */health* |
| PR có CI thành công | *link* |
| PR có CI thất bại (lint) | *link* |
| Lần chạy CD thành công | *link* |
| Lần rollback | *link* |
| Release v2.0.0 | *link* |
| Video demo | *link* |

## Sprint Review (demo)
| Hạng mục | Kết quả | Minh chứng |
|---|---|---|
| Luồng end-to-end trên điện thoại | Menu → chi tiết → giỏ → đăng ký → thanh toán Ví → xác nhận “Đã thanh toán” → lịch sử | E2E-T01 (CI), video |
| Thanh toán lỗi và thử lại | Bật “Mô phỏng thanh toán lỗi” → PAYMENT_FAILED → thử lại → PAID | INT-T09, video |
| Migration, health | `/health` trả `db: up`, `migrations: 2`, `version: <SHA>` | INT-T24, SMOKE |
| CI/CD | Merge PR → image SHA trên GHCR → Render → smoke test xanh | link lần chạy CD |
| Rollback | Run workflow `rollback_to=<SHA cũ>` → `/health` về SHA cũ | link lần chạy |
| Kiểm thử | 15 unit + 27 integration (API), 7 test component (web), 1 E2E, tất cả đạt | log CI |

Phản hồi của Product Owner: *ghi phản hồi thật sau buổi review*.

## Sprint Retrospective
| Làm tốt | Cần cải thiện | Hành động tiếp theo |
|---|---|---|
| Pipeline xác nhận đúng commit SHA đang chạy qua `/health` trước khi báo thành công | Gói miễn phí Render ngủ sau 15 phút làm smoke test chậm | Giữ cơ chế thử lại; cân nhắc gói trả phí khi demo thật |
| Ràng buộc CSDL (CHECK, FK, UNIQUE) bắt lỗi ở tầng thấp nhất | Chưa có giao diện nhân viên | Đưa B-01 lên Sprint kế tiếp |
| E2E chạy trên khung hình điện thoại phát hiện lỗi bố cục sớm | JWT trong localStorage | B-04 cookie HttpOnly + refresh token |
