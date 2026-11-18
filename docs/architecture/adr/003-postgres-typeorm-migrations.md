# ADR-003: PostgreSQL, TypeORM và migration thay cho synchronize

- Trạng thái: Đã chấp nhận (thay quyết định `synchronize: true` của Assignment 1)
- Ngày: 2026-11-18
- Liên quan: NFR-04, NFR-08, Task 5.2 (migration/seed tái tạo database)

## Bối cảnh
Assignment 1 để TypeORM tự tạo bảng (`synchronize`). Cách này có thể xoá cột hoặc dữ liệu khi entity đổi, không có lịch sử thay đổi schema và không rollback được — không phù hợp với production.

## Quyết định
- PostgreSQL 16 là CSDL duy nhất (bắt buộc theo đề).
- Tắt `synchronize`. Schema được quản lý bằng migration TypeORM trong `apps/api/src/database/migrations`, sinh bằng `npm run migration:generate` rồi xem lại trước khi commit. Mỗi migration có `down()`.
- Ràng buộc toàn vẹn đặt ở CSDL: `UNIQUE(payments.idempotencyKey)`, `UNIQUE(orders.userId, idempotencyKey)`, `UNIQUE(loyalty_transactions.orderId, type)`, `CHECK(stock >= 0)`, `CHECK(loyaltyPoints >= 0)`, khoá ngoại giữa các bảng.
- Dữ liệu mẫu do `SeedService` nạp khi bảng rỗng (idempotent), tách khỏi migration để production có thể tắt bằng `SEED=false`.

## Hệ quả
- CSDL tái tạo được từ rỗng bằng migration + seed (integration test làm việc này mỗi lần chạy).
- Lập trình viên phải tạo migration mỗi khi đổi entity; CI sẽ phát hiện thiếu migration vì test chạy trên schema từ migration.
