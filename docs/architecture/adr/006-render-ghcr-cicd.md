# ADR-006: Triển khai trên Render bằng image Docker từ GHCR, CI/CD bằng GitHub Actions

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-18
- Liên quan: Task 3.2, Task 5.3, Task 5.4, NFR-05, NFR-07, NFR-08, ràng buộc C-03, C-05

## Bối cảnh
Cần URL production HTTPS, CSDL không public, triển khai tự động, rollback được, chi phí 0 đồng, nhóm 1 người.

## Phương án đã xem xét
| Phương án | Nhận xét |
|---|---|
| Vercel (web) + Railway (API, DB) | Hai nền tảng, Railway không còn gói miễn phí lâu dài |
| Fly.io | Cần thẻ thanh toán, cấu hình mạng phức tạp hơn |
| VPS + Docker Compose | Tự quản lý TLS, bảo mật, sao lưu |
| **Render + GHCR** | Gói miễn phí cho web service chạy Docker image và PostgreSQL; HTTPS tự động; Internal URL cho CSDL; deploy hook nhận `imgURL`; Blueprint `render.yaml` |

## Quyết định
- **Registry**: GitHub Container Registry. Image tag = commit SHA đầy đủ (bất biến), thêm `latest` cho main và `X.Y.Z` khi đẩy tag `vX.Y.Z`. Package đặt chế độ public để Render kéo được mà không cần lưu mật khẩu registry (image không chứa secret).
- **Hạ tầng**: `render.yaml` (Blueprint) khai báo `brewlite-web`, `brewlite-api`, `brewlite-db` ở region Singapore; `autoDeploy: false` để chỉ pipeline được triển khai; `ipAllowList: []` để CSDL không nhận kết nối từ Internet.
- **CI** (`ci.yml`, chạy trên PR): install → lint → unit test → build cho từng app, integration test với PostgreSQL, e2e Playwright, gitleaks. Nhánh `main` được bảo vệ, bắt buộc các check này.
- **CD** (`cd.yml`, chạy khi push `main` hoặc tag): gọi lại `ci.yml` làm quality gate → build & push image → gọi deploy hook API với image SHA → chờ `/health` báo đúng SHA → deploy web → smoke test → nếu lỗi tự triển khai lại SHA trước đó (lấy từ `/health` trước khi deploy) và dừng pipeline với lỗi. `workflow_dispatch` với `rollback_to` để rollback tay.
- **Secret**: deploy hook trong GitHub Secrets (environment `production`), biến ứng dụng trong Render Environment; GitHub tự che secret trong log.

## Hệ quả
- Rollback chỉ là triển khai lại một image đã có, mất khoảng 2–5 phút.
- Gói miễn phí: dịch vụ ngủ sau 15 phút không có request (lần đầu mất khoảng 1 phút), smoke test có thử lại; Postgres miễn phí hết hạn sau 30 ngày, cần tạo lại hoặc nâng gói (ghi trong `docs/deployment.md`).
- Không có CDN riêng cho tài nguyên tĩnh; có thể thêm Render Static Site/Cloudflare sau.
