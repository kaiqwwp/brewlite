# Product Backlog – Assignment 2

Nguồn sự thật của backlog là **GitHub Issues + Project board** (cột *Backlog → Sprint → In progress → In review → Done*). Tệp này là bản chụp để nộp kèm và là đầu vào cho script tạo issue: `scripts/create-github-backlog.sh` (cần `gh auth login`).

Ước lượng bằng story point (SP, Fibonacci). Một thành viên kiêm PO, SM, Dev. Hai Sprint, mỗi Sprint 1 tuần.

| Trạng thái | Ý nghĩa |
|---|---|
| Done | Đạt Definition of Done, đã merge vào `main` |
| Cần làm (người dùng) | Cần tài khoản GitHub/Render hoặc thao tác tay của thành viên nhóm |

## Sprint 1 – Nền tảng, tài liệu, MVP xem menu (Task 1 → 4)

| ID | Hạng mục | Task đề | Yêu cầu | SP | MoSCoW | Trạng thái |
|---|---|---|---|---|---|---|
| S1-01 | Bối cảnh, stakeholder, phạm vi, giả định, ràng buộc, rủi ro | 1.1 | – | 2 | Must | Done |
| S1-02 | SRS rút gọn: FR, NFR, MoSCoW, tiêu chí chấp nhận, use-case tổng quát | 1.2 | FR-01…FR-15, NFR-01…NFR-11 | 3 | Must | Done |
| S1-03 | Đặc tả UC-05 Đặt và thanh toán đơn hàng | 1.3 | FR-05, FR-07 | 2 | Must | Done |
| S1-04 | Activity, sequence (PlantUML + SVG), class diagram | 2.1–2.3 | FR-01…FR-12 | 3 | Must | Done |
| S1-05 | Kiến trúc C4 + phân lớp, 7 ADR | 3.1 | NFR-* | 3 | Must | Done |
| S1-06 | Deployment diagram production (Render, GHCR, GitHub Actions) | 3.2 | NFR-07, NFR-08 | 2 | Must | Done |
| S1-07 | Repo `apps/web`, `apps/api`, `docs`; branch/PR/commit convention; README, `.env.example`; DoD | 4.1, 4.2 | NFR-10 | 2 | Must | Done |
| S1-08 | API `GET /products`, `GET /products/:id`, seed | 4.3 | FR-01, FR-02 | 2 | Must | Done (tái sử dụng Assignment 1) |
| S1-09 | Màn hình Menu mobile-first với loading/empty/error | 4.3 | FR-01, NFR-06 | 3 | Must | Done (tái sử dụng Assignment 1) |
| S1-10 | Test API sản phẩm và component Menu (Vitest + Testing Library) | 4.3 | FR-01 | 2 | Must | Done |
| S1-11 | CI: install → lint → unit test → build; ESLint cho hai app; bảo vệ nhánh | 4.4 | NFR-10 | 3 | Must | Done (file workflow); bật branch protection: Cần làm (người dùng) |
| | **Tổng Sprint 1** | | | **27** | | |

## Sprint 2 – Luồng end-to-end, CI/CD, production (Task 5)

| ID | Hạng mục | Task đề | Yêu cầu | SP | MoSCoW | Trạng thái |
|---|---|---|---|---|---|---|
| S2-01 | Chi tiết sản phẩm, size, topping | 5.1 | FR-02 | 2 | Must | Done (Assignment 1) |
| S2-02 | Giỏ hàng, tổng tiền | 5.1 | FR-03 | 2 | Must | Done (Assignment 1) + FE-T02 |
| S2-03 | Đăng ký, đăng nhập, JWT | 5.1 | FR-04 | 2 | Must | Done (Assignment 1) |
| S2-04 | Tạo đơn: giá server, tồn kho, idempotent | 5.1 | FR-05, FR-06 | 3 | Must | Done (Assignment 1) |
| S2-05 | Thanh toán Ví/Thẻ mô phỏng, idempotent, thử lại | 5.1 | FR-07 | 3 | Must | Done (Assignment 1) |
| S2-06 | Xác nhận, trạng thái, lịch sử đơn | 5.1 | FR-08, FR-09 | 2 | Must | Done (Assignment 1) |
| S2-07 | Validate và xử lý lỗi frontend/backend | 5.1 | NFR-05, NFR-06 | 1 | Must | Done |
| S2-08 | Migration TypeORM thay `synchronize`; entity `Promotion`, `LoyaltyTransaction`; khoá ngoại, CHECK; `GET /loyalty/me` | 5.2 | FR-12, NFR-04, NFR-08 | 3 | Must | Done |
| S2-09 | `GET /health` (CSDL, migration, version), log JSON, kiểm tra cấu hình khi khởi động | 5.2 | NFR-07, NFR-09 | 2 | Must | Done |
| S2-10 | Integration test nền tảng (INT-T24…T27), E2E Playwright menu → xác nhận đơn | 5.2 | FR-01…FR-09 | 3 | Must | Done |
| S2-11 | PWA: manifest, icon, service worker, trang ngoại tuyến | 5.1 | FR-13 | 2 | Could | Done |
| S2-12 | CD: image SHA → GHCR → deploy hook Render → smoke test → rollback; `render.yaml` | 5.3 | NFR-07, NFR-08 | 5 | Must | Done (pipeline); tạo dịch vụ Render, secret: Cần làm (người dùng) |
| S2-13 | Release v2.0.0, release notes, README, video demo, Sprint Review và Retrospective | 5.4 | – | 2 | Must | Tài liệu: Done; tag, URL production, video: Cần làm (người dùng) |
| | **Tổng Sprint 2** | | | **32** | | |

## Phạm vi mở rộng (chưa lên Sprint)

| ID | Hạng mục | Yêu cầu | MoSCoW |
|---|---|---|---|
| B-01 | Giao diện nhân viên quầy | FR-14 | Won't (2.0) |
| B-02 | Thông báo khi đơn READY | FR-15 | Won't (2.0) |
| B-03 | Đơn PENDING tự hết hạn sau 15 phút, nhả tồn kho | NFR-04 | Should |
| B-04 | Cookie HttpOnly + refresh token | NFR-03 | Should |
| B-05 | Cổng thanh toán thật + hoàn tiền khi hủy | FR-07 | Could |
| B-06 | Rate limit cho `/auth/*` | NFR-05 | Should |
