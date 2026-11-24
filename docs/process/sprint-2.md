# Sprint 2

| Mục | Nội dung |
|---|---|
| Thời gian | 1 tuần · 04/11/2026 – 10/11/2026 |
| Sprint Goal | Hoàn thành luồng end-to-end, tự động hoá đóng gói và triển khai một phiên bản production truy cập được |
| Cam kết | S2-01 → S2-13, 32 SP ([backlog](product-backlog.md)) |

## Việc còn lại trước khi nghiệm thu (điền khi xong)

- [x] Tạo repo GitHub, đẩy mã và tag; bật branch protection ([deployment.md](../deployment.md) mục 2.1)
- [x] Tạo Blueprint Render, thêm deploy hook vào GitHub Secrets (mục 2.2)
- [x] CD xanh trên `main`; điền URL bên dưới
- [ ] Đẩy tag `v2.0.0` → GitHub Release
- [ ] Chụp minh chứng CI đỏ/xanh, CD, rollback vào `docs/evidence/`
- [ ] Quay video demo end-to-end trên URL production

| Thông tin bàn giao | Giá trị |
|---|---|
| Repository | https://github.com/kaiqwwp/brewlite |
| Web production | https://brewlite-web-ed96.onrender.com |
| API production | https://brewlite-api-9uli.onrender.com · health: https://brewlite-api-9uli.onrender.com/health |
| PR có CI thành công | https://github.com/kaiqwwp/brewlite/pulls?q=is:pr+head:docs/sprint-review |
| PR có CI thất bại (lint) | https://github.com/kaiqwwp/brewlite/pulls?q=is:pr+head:demo/ci-fail |
| Lần chạy CD thành công | https://github.com/kaiqwwp/brewlite/actions/workflows/cd.yml?query=branch:main+is:success |
| Lần rollback | https://github.com/kaiqwwp/brewlite/actions/workflows/cd.yml?query=event:workflow_dispatch |
| Release v2.0.0 | https://github.com/kaiqwwp/brewlite/releases/tag/v2.0.0 |
| Video demo | [docs/evidence/video.md](../evidence/video.md) |

## Sprint Review (demo)
| Hạng mục | Kết quả | Minh chứng |
|---|---|---|
| Luồng end-to-end trên điện thoại | Menu → chi tiết → giỏ → đăng ký → thanh toán Ví → xác nhận “Đã thanh toán” → lịch sử | E2E-T01 (CI), video |
| Thanh toán lỗi và thử lại | Bật “Mô phỏng thanh toán lỗi” → PAYMENT_FAILED → thử lại → PAID | INT-T09, video |
| Migration, health | `/health` trả `db: up`, `migrations: 2`, `version: <SHA>` | INT-T24, SMOKE |
| CI/CD | Merge PR → image SHA trên GHCR → Render → smoke test xanh | link lần chạy CD |
| Rollback | Run workflow `rollback_to=<SHA cũ>` → `/health` về SHA cũ | link lần chạy |
| Kiểm thử | 15 unit + 27 integration (API), 7 test component (web), 1 E2E, tất cả đạt | log CI |

Phản hồi của Product Owner (đóng vai quản lý cửa hàng): luồng đặt và thanh toán trên điện thoại đủ nhanh để dùng tại quầy, thông báo khi thanh toán lỗi rõ ràng và thử lại được ngay. Đề nghị cho bản sau: màn hình riêng cho nhân viên quầy đổi trạng thái đơn (hiện phải gọi API) và báo cho khách khi đơn chuyển sang `READY`. Hai đề nghị được đưa vào Product Backlog.

## Sprint Retrospective
| Làm tốt | Cần cải thiện | Hành động tiếp theo |
|---|---|---|
| Pipeline xác nhận đúng commit SHA đang chạy qua `/health` trước khi báo thành công | Gói miễn phí Render ngủ sau 15 phút làm smoke test chậm | Giữ cơ chế thử lại; cân nhắc gói trả phí khi demo thật |
| Ràng buộc CSDL (CHECK, FK, UNIQUE) bắt lỗi ở tầng thấp nhất | Chưa có giao diện nhân viên | Đưa B-01 lên Sprint kế tiếp |
| E2E chạy trên khung hình điện thoại phát hiện lỗi bố cục sớm | JWT trong localStorage | B-04 cookie HttpOnly + refresh token |
