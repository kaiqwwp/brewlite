# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/lang/vi/).

## [2.0.0] – Assignment 2
Chi tiết: [docs/releases/v2.0.0.md](docs/releases/v2.0.0.md).
### Added
- Tài liệu Task 1–3: SRS, đặc tả UC-05, sơ đồ PlantUML, kiến trúc C4, 7 ADR, ma trận truy vết, runbook triển khai.
- Migration TypeORM, entity `LoyaltyTransaction`, `GET /loyalty/me`, `GET /health` (API và web), log JSON, kiểm tra cấu hình.
- PWA: manifest, icon, service worker, trang ngoại tuyến.
- ESLint, Vitest, Playwright E2E, CI (PR) và CD (GHCR → Render, smoke test, rollback), `render.yaml`.
### Changed
- Cấu trúc `apps/web`, `apps/api`; bảng `coupons` → `promotions`; Dockerfile chạy user `node`, có HEALTHCHECK.
### Removed
- `synchronize`/`DB_SYNC` của TypeORM.

## [1.0.0] – Assignment 1
Chi tiết: [docs/releases/v1.0.0.md](docs/releases/v1.0.0.md).
