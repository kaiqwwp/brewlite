# BrewLite – Đặt cà phê không tiền mặt

Ứng dụng web mobile-first (PWA) cho khách xem menu, chọn size/topping, đặt và thanh toán đồ uống bằng ví điện tử hoặc thẻ (mô phỏng), rồi nhận tại quầy.

Bài tập lớn môn **Công nghệ Phần mềm**, ĐH Sài Gòn, HK I 2026–2027 · Thực hiện: Lâm Sơn Hùng (3123560031) · Giảng viên: Từ Lãng Phiêu · Quy trình: Agile Scrum.

| | |
|---|---|
| Web production | *https://brewlite-web.onrender.com* (điền URL thật sau khi triển khai) |
| API production | *https://brewlite-api.onrender.com* · health check: `/health` |
| Phiên bản | 2.0.0 (Assignment 2) – [release notes](docs/releases/v2.0.0.md) · [CHANGELOG](CHANGELOG.md) |

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| `apps/web` | Next.js 14 (App Router, TypeScript), Tailwind CSS, Zustand, PWA (manifest + service worker) |
| `apps/api` | NestJS 10, TypeORM 0.3 (migration), Passport JWT, bcrypt, class-validator |
| CSDL | PostgreSQL 16 |
| Kiểm thử | Jest + Supertest (API), Vitest + Testing Library (web), Playwright (E2E) |
| DevOps | Docker, Docker Compose, GitHub Actions, GitHub Container Registry, Render |

## Tài liệu

| Task | Tạo phẩm |
|---|---|
| 1 – Yêu cầu | [Bối cảnh và phạm vi](docs/requirements/context-and-scope.md) · [SRS](docs/requirements/srs.md) · [Đặc tả UC-05](docs/requirements/use-case-checkout.md) |
| 2 – Mô hình hóa | [Activity, sequence, class (PlantUML + SVG)](docs/diagrams/README.md) |
| 3 – Kiến trúc | [Kiến trúc C4 + phân lớp](docs/architecture/architecture.md) · [ADR](docs/architecture/adr/) · [Deployment diagram](docs/diagrams/deployment-production.svg) |
| 4, 5 – Sprint | [Product Backlog](docs/process/product-backlog.md) · [Sprint 1](docs/process/sprint-1.md) · [Sprint 2](docs/process/sprint-2.md) · [Definition of Done](docs/process/definition-of-done.md) · [Quy ước](CONTRIBUTING.md) |
| Truy vết | [traceability-matrix.md](docs/traceability-matrix.md) |
| Triển khai | [deployment.md](docs/deployment.md) – CI/CD, thiết lập Render, phát hành, rollback |
| Báo cáo Assignment 2 | [report-a2/Assignment2_report.pdf](report-a2/Assignment2_report.pdf) · nguồn LaTeX `report-a2/` (Overleaf, XeLaTeX) |
| Assignment 1 | [Báo cáo kiểm thử giao diện](docs/BrewLite_Bao_cao_kiem_thu.pdf) · `report/` (LaTeX) |

## 1. Chạy ở máy local bằng Docker (khuyến nghị)

Yêu cầu: Docker Desktop (hoặc Docker Engine + Compose v2).

```bash
git clone https://github.com/kaiqwwp/brewlite.git && cd brewlite
docker compose up --build
```

- Web: http://localhost:3000 · API: http://localhost:3001 · Health: http://localhost:3001/health
- Lần chạy đầu, API tự chạy migration và nạp dữ liệu mẫu (8 đồ uống, 2 mã giảm giá, 1 tài khoản nhân viên).
- Dừng: `docker compose down` (thêm `-v` để xoá dữ liệu). Nâng cấp từ bản 1.0.0 nên chạy `docker compose down -v` một lần vì schema nay do migration quản lý.
- Mở web từ máy khác trong mạng: `NEXT_PUBLIC_API_URL=http://<ip>:3001 CORS_ORIGIN=http://<ip>:3000 docker compose up --build` (URL API được nhúng vào web lúc build).

## 2. Chạy không dùng Docker

Yêu cầu: Node.js 22, PostgreSQL 16 có CSDL `brewlite` (user/mật khẩu `postgres`/`postgres`, hoặc đặt `DATABASE_URL`).

```bash
npm run install:all                    # cài gốc (Playwright), apps/api, apps/web
cd apps/api && npm run start:dev       # http://localhost:3001, tự chạy migration + seed
cd apps/web && npm run dev             # http://localhost:3000
```

Biến môi trường: xem [.env.example](.env.example).

## 3. Kiểm thử

```bash
createdb brewlite_test                 # một lần; đổi bằng TEST_DATABASE_URL
npm run lint                           # ESLint + kiểm tra kiểu cho api và web
npm test                               # unit: 15 test API + 7 test component web
npm run test:integration               # 27 integration test API trên PostgreSQL thật (schema tạo bằng migration)
npm run build                          # build api và web
docker compose up --build -d && npm run test:e2e   # E2E Playwright: menu → xác nhận đơn (khung Pixel 7)
npx playwright install chromium        # nếu máy chưa có trình duyệt cho Playwright
```

Mã test (`UT-xx`, `INT-Txx`, `FE-Txx`, `E2E-T01`) được nối với yêu cầu trong [ma trận truy vết](docs/traceability-matrix.md).

## 4. Build, deploy, rollback

| Việc | Lệnh / cách làm |
|---|---|
| Build image local | `docker build -t brewlite-api apps/api` · `docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 -t brewlite-web apps/web` |
| CI | Tự chạy khi mở PR vào `main`: install → lint → unit test → build → integration → e2e → gitleaks |
| Deploy production | Merge PR vào `main` (hoặc đẩy tag `vX.Y.Z`): CD build image tag commit SHA → GHCR → Render → smoke test |
| Smoke test tay | `npm run smoke -- https://<api> https://<web>` |
| Rollback | GitHub → Actions → **CD** → *Run workflow* → `rollback_to` = SHA bản tốt. Pipeline cũng tự rollback khi deploy/smoke test lỗi |
| Thiết lập lần đầu | [docs/deployment.md](docs/deployment.md) mục 2 |

## 5. Tài khoản và dữ liệu mẫu

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng | tự đăng ký tại `/register` | tối thiểu 6 ký tự |
| Nhân viên quầy | `staff@brewlite.local` | local: `staff123`; production: giá trị `STAFF_PASSWORD` trên Render |

Mã giảm giá: `BREW10` (10%, tối đa 20.000đ), `WELCOME20` (20% cho đơn từ 100.000đ, tối đa 50.000đ). Điểm thưởng: 1 điểm mỗi 10.000đ đơn đã thanh toán. Màn hình thanh toán có ô *Mô phỏng thanh toán lỗi* để demo `PAYMENT_FAILED` → thử lại.

## 6. API

| Endpoint | Chức năng | Auth |
|---|---|---|
| `GET /health` | Trạng thái API, CSDL, số migration, phiên bản (commit SHA) | – |
| `GET /products`, `GET /products/:id` | Menu; chi tiết + tuỳ chọn size/topping | – |
| `POST /auth/register`, `POST /auth/login` | Đăng ký, đăng nhập, trả JWT | – |
| `GET /auth/me` | Tài khoản + điểm thưởng | JWT |
| `POST /orders` | Tạo đơn `PENDING`, giữ kho, áp mã. Header `Idempotency-Key` tuỳ chọn | JWT |
| `POST /payments` | Thanh toán Ví/Thẻ, bắt buộc `Idempotency-Key`. `201` thành công, `200` phát lại, `402` thất bại | JWT |
| `GET /orders/me`, `GET /orders/:id` | Lịch sử đơn; chi tiết đơn | JWT |
| `POST /orders/:id/cancel` | Hủy đơn, hoàn kho, thu hồi điểm | JWT |
| `PATCH /orders/:id/status` | Nhân viên chuyển `PREPARING → READY → COMPLETED` | JWT + STAFF |
| `GET /loyalty/me` | Số dư và lịch sử cộng/thu hồi điểm | JWT |

## 7. Cấu trúc repository

```
brewlite/
├── apps/
│   ├── web/                  # Next.js mobile-first/PWA (app/, components/, lib/, __tests__/, Dockerfile)
│   └── api/                  # NestJS (src/, src/database/migrations/, test/unit, test/e2e, Dockerfile)
├── docs/
│   ├── requirements/         # Task 1
│   ├── diagrams/             # Task 2 (+ C4, deployment) – .puml và .svg
│   ├── architecture/         # Task 3 – architecture.md, adr/
│   ├── process/              # backlog, sprint review/retro, DoD
│   ├── releases/             # release notes
│   ├── traceability-matrix.md
│   └── deployment.md
├── tests/e2e/                # Playwright
├── scripts/                  # smoke-test.mjs, create-github-backlog.sh, demo-api.ps1
├── .github/workflows/        # ci.yml, cd.yml
├── render.yaml               # hạ tầng Render (Blueprint)
├── docker-compose.yml
├── .env.example
└── README.md
```
