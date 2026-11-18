# ADR-002: Backend là modular monolith NestJS

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-18
- Liên quan: FR-05, FR-07, FR-12, NFR-04

## Bối cảnh
Tạo đơn, trừ tồn kho, thanh toán và cộng điểm phải nhất quán: nếu một bước lỗi thì không bước nào được ghi. Lưu lượng nhỏ, một người phát triển, ngân sách 0 đồng.

## Phương án đã xem xét
1. **Microservices** (order, payment, inventory riêng): cần saga hoặc outbox, nhiều container, nhiều chi phí vận hành.
2. **Modular monolith**: một tiến trình, chia module theo domain, dùng chung transaction PostgreSQL.

## Quyết định
Chọn phương án 2. Mỗi domain là một NestJS module (`auth`, `products`, `orders`, `payments`, `promotions`, `loyalty`, `health`). Module chỉ gọi nhau qua service được export (ví dụ `PaymentsModule` dùng `OrdersService.lockOrder/transition`), không truy cập trực tiếp bảng của module khác ngoài transaction được truyền vào.

## Hệ quả
- Transaction ACID chung cho đặt đơn và thanh toán, test dễ.
- Một image, một dịch vụ Render cho API.
- Không scale riêng từng domain. Khi cần tách (ví dụ payment), ranh giới module đã có sẵn và `MockPaymentGateway` là điểm cắt tự nhiên.
