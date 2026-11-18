# Ma trận truy vết

Mỗi yêu cầu trong [SRS](requirements/srs.md) được nối tới user story / use-case, sơ đồ thiết kế, mã nguồn / API và test chứng minh. Đường dẫn mã tính từ gốc repository. Cập nhật bảng này trong cùng PR khi đổi yêu cầu, API, sơ đồ hoặc test.

**Ký hiệu test**: `UT-xx` unit test API (`apps/api/test/unit`), `INT-Txx` integration test API với PostgreSQL (`apps/api/test/e2e`), `FE-Txx` test component web (`apps/web/__tests__`), `E2E-T01` Playwright (`tests/e2e/checkout.spec.ts`), `UI-<nhóm>` bộ 55 kịch bản giao diện của Assignment 1 ([báo cáo](BrewLite_Bao_cao_kiem_thu.pdf)), `SMOKE` smoke test sau triển khai (`scripts/smoke-test.mjs`), `CI` pipeline (`.github/workflows`).

**Sơ đồ**: UseCase-00/01, Activity-01, Sequence-01, Class-01, C4-01/02, Deploy-01 (xem [diagrams/README.md](diagrams/README.md)).

## 1. Yêu cầu chức năng

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / API | Test |
|---|---|---|---|---|
| FR-01 Xem menu | UC-01 · US-01 Xem menu | Activity-01 (tải menu, lỗi/thử lại), Class-01 `Product` | `GET /products` – `apps/api/src/products/products.controller.ts`; `apps/web/app/page.tsx` | INT-T01, FE-T01, E2E-T01, UI-A |
| FR-02 Chi tiết, size, topping | UC-02 · US-02 Chọn size và topping | Activity-01 (chọn món, hết hàng), Class-01 `Size`, `OrderItem` | `GET /products/:id`; `apps/api/src/common/catalog.ts` (`unitPrice`); `apps/web/app/products/[id]/page.tsx` | INT-T01, UT-05, UT-06, UT-07, UI-A |
| FR-03 Giỏ hàng | UC-03 · US-03 Quản lý giỏ hàng | Activity-01 (thêm giỏ, gộp món) | `apps/web/lib/store.ts` (`useCart`, `cartTotal`); `apps/web/app/cart/page.tsx` | FE-T02, UI-B |
| FR-04 Đăng ký, đăng nhập, JWT | UC-04 · US-04 Đăng ký và đăng nhập | Activity-01 (chưa đăng nhập), Sequence-01 bước 04–06, ADR-007 | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` – `apps/api/src/auth/*`; `apps/web/components/AuthForm.tsx`, `useRequireAuth.ts` | INT-T02, INT-T03, INT-T04, E2E-T01, UI-C |
| FR-05 Đặt đơn, giá server, tồn kho | UC-05 (luồng chính bước 4–5, A1, A4, E1, E3) · US-07, US-08 | Sequence-01 bước 03–24, Activity-01 (validate, hết hàng), Class-01 `Order`, `OrderItem`, ADR-005 | `POST /orders` – `apps/api/src/orders/orders.service.ts`, `stock.service.ts`; `apps/web/app/checkout/page.tsx` | INT-T05, INT-T06, INT-T14, INT-T15, INT-T18, INT-T19, INT-T20, INT-T25, E2E-T01 |
| FR-06 Mã giảm giá | UC-06 «extend» UC-05 · US-09 | Class-01 `Promotion`, Sequence-01 bước 15 | `apps/api/src/promotions/promotions.service.ts` (`computeDiscount`); `entities/promotion.entity.ts` | UT-08, UT-09, UT-10, INT-T21, INT-T23, UI-D |
| FR-07 Thanh toán Ví/Thẻ, idempotent | UC-05 (bước 6–8, A4, A5, E5–E7), UC-07 · US-05 Thanh toán không tiền mặt, US-07 | Sequence-01 bước 25–49, Activity-01 (cổng từ chối/chấp nhận), Class-01 `Payment`, ADR-005 | `POST /payments` – `apps/api/src/payments/payments.service.ts`, `mock-gateway.ts` | INT-T08, INT-T09, INT-T10, INT-T16, INT-T17, E2E-T01, UI-D |
| FR-08 Xác nhận, trạng thái đơn | UC-05 bước 9–10, UC-08 · US-06 | Sequence-01 bước 41–43, Activity-01 (xác nhận, theo dõi) | `GET /orders/:id`; `apps/web/app/orders/[id]/page.tsx` | E2E-T01, UI-E |
| FR-09 Lịch sử đơn | UC-08 · US-06 | Activity-01 (theo dõi đơn) | `GET /orders/me`; `apps/web/app/orders/page.tsx` | INT-T07, E2E-T01, UI-E |
| FR-10 Quản lý trạng thái đơn | UC-11 · US-10 Nhân viên cập nhật pha chế | Class-01 `OrderStatus`; state machine (sơ đồ draw.io `state-order` của Assignment 1) | `PATCH /orders/:id/status` – `apps/api/src/orders/order-status.ts` (`assertTransition`), `orders.controller.ts` (`RolesGuard`) | UT-01, UT-02, UT-03, UT-04, INT-T11, INT-T12 |
| FR-11 Hủy đơn | UC-09 · US-11 | Activity-01 (hủy đơn sau thanh toán lỗi) | `POST /orders/:id/cancel` – `orders.service.ts` | INT-T13, INT-T22, UI-E |
| FR-12 Điểm thưởng | UC-10 · US-09, US-13 | Class-01 `LoyaltyTransaction`, Sequence-01 bước 38 | `promotions.service.ts` (`awardPoints`, `revokePoints`), `GET /loyalty/me` – `apps/api/src/loyalty/loyalty.controller.ts`; migration `AddRelationsAndChecks` | UT-11, INT-T16, INT-T21, INT-T22, INT-T26, INT-T27 |
| FR-13 PWA | UC-12 · US-12 | C4-02 (Web app), Deploy-01 (PWA trên thiết bị) | `apps/web/app/manifest.ts`, `public/sw.js`, `public/offline.html`, `components/PwaRegister.tsx` | SMOKE (manifest), kiểm tra thủ công Lighthouse |

## 2. Yêu cầu phi chức năng

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / Cấu hình | Test / Minh chứng |
|---|---|---|---|---|
| NFR-01 Hiệu năng API | UC-05 mục 6 | Sequence-01 (một transaction mỗi bước) | `common/request-logger.ts` ghi `ms` | Log trên Render; số đo trong báo cáo kiểm thử |
| NFR-02 Hiệu năng giao diện | US-01 | C4-02 | `next build` (First Load JS ~100 KB) | Kết quả build trong CI job `web` |
| NFR-03 Xác thực an toàn | US-04 | ADR-007 | `auth/*`, `common/config.ts` | INT-T02, UT-12, UT-13, UT-14, UT-15 |
| NFR-04 Toàn vẹn giao dịch, tồn kho | US-07, US-08 | ADR-003, ADR-005, Sequence-01, Class-01 (UNIQUE, CHECK) | `payments.service.ts`, `stock.service.ts`, migration `AddRelationsAndChecks` | INT-T14 → INT-T20, INT-T25 |
| NFR-05 Đầu vào, phân quyền, secret | US-04, US-10 | ADR-006, ADR-007, Deploy-01 (CSDL không public) | `app.setup.ts` (ValidationPipe, CORS), `auth/guards.ts`, `render.yaml` (`ipAllowList: []`), `.gitignore` | INT-T04, INT-T06, INT-T07, INT-T12, CI job `secrets` |
| NFR-06 Khả dụng trên di động | US-01 → US-06 | Activity-01 (trạng thái loading/lỗi) | `components/ui.tsx` (Spinner, ErrorBox, Empty), Tailwind | FE-T01, E2E-T01 (Pixel 7), UI-H |
| NFR-07 Sẵn sàng, tự khôi phục | US-14 | Deploy-01 (health check), ADR-004 | `health/health.controller.ts`, `apps/web/app/health/route.ts`, `HEALTHCHECK` trong Dockerfile, bước rollback trong `cd.yml` | INT-T24, SMOKE |
| NFR-08 Khả năng triển khai | US-14 Tự động triển khai | Deploy-01, ADR-006 | `docker-compose.yml`, `apps/*/Dockerfile`, `render.yaml`, `.github/workflows/cd.yml` | CI, CD, SMOKE |
| NFR-09 Quan sát được | US-14 | Kiến trúc mục 7 | `common/request-logger.ts`, `/health` trả `version` | INT-T24 |
| NFR-10 Bảo trì, chất lượng | – | ADR-001, ADR-003 | `.eslintrc.*`, `ci.yml`, branch protection, `database/migrations` | CI (lint, test, build) |
| NFR-11 Tương thích trình duyệt | US-12 | – | `browserslist` mặc định của Next.js | E2E-T01 (Chromium), kiểm tra thủ công Safari |

## 3. User story bổ sung ở Assignment 2

US-01 → US-09 giữ nguyên từ Assignment 1 (báo cáo mục Product Backlog).

| Mã | User story | Tiêu chí chấp nhận chính |
|---|---|---|
| US-10 | Là nhân viên quầy, tôi muốn cập nhật đơn sang PREPARING, READY, COMPLETED để khách biết tiến độ. | Chỉ STAFF; sai thứ tự trả 409 (FR-10) |
| US-11 | Là khách hàng, tôi muốn hủy đơn chưa pha chế để đổi ý. | Hủy khi PENDING/PAYMENT_FAILED/PAID, hoàn kho, thu hồi điểm (FR-11) |
| US-12 | Là khách hàng, tôi muốn cài BrewLite lên màn hình chính để mở nhanh như ứng dụng. | Có manifest, icon, service worker, trang ngoại tuyến (FR-13) |
| US-13 | Là khách hàng, tôi muốn xem lịch sử cộng/trừ điểm để biết điểm của mình đến từ đâu. | `GET /loyalty/me` trả số dư và giao dịch EARN/REVOKE (FR-12) |
| US-14 | Là nhóm phát triển, tôi muốn mỗi lần merge vào main được kiểm thử và triển khai tự động, lỗi thì tự rollback. | CI chặn merge khi lỗi; CD deploy image theo SHA, smoke test, rollback (NFR-07, NFR-08) |
