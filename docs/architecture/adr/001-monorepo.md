# ADR-001: Monorepo với apps/web, apps/api, docs

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-18
- Liên quan: NFR-08, NFR-10, ràng buộc C-02, C-04

## Bối cảnh
Đề Assignment 2 yêu cầu cấu trúc `apps/web`, `apps/api`, `docs` và truy vết từ yêu cầu tới code, test. Nhóm chỉ có một người. Assignment 1 dùng hai thư mục `frontend/`, `backend/`.

## Quyết định
Dùng một repository (monorepo) với `apps/web` (Next.js), `apps/api` (NestJS), `docs/` (tạo phẩm Task 1–3), `tests/e2e` (Playwright), `.github/workflows` (CI/CD). Mỗi app giữ `package.json` và `package-lock.json` riêng; `package.json` ở gốc chỉ chứa script tổng hợp và Playwright. Không dùng npm workspaces hay Nx/Turborepo.

## Hệ quả
- Một PR có thể sửa API, UI, tài liệu và test cùng lúc; ma trận truy vết trỏ được tới đường dẫn thật.
- Dockerfile của mỗi app build độc lập từ thư mục của nó, image nhỏ.
- CI chạy matrix `[api, web]`; khi repo lớn hơn có thể lọc theo đường dẫn thay đổi.
- Không có cơ chế chia sẻ code giữa hai app (kiểu dữ liệu API khai báo lại ở `apps/web/lib/api.ts`). Chấp nhận vì bề mặt API nhỏ.
