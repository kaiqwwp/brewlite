# ADR-005: Idempotency-Key, khoá dòng đơn và optimistic locking tồn kho

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-18
- Liên quan: FR-05, FR-07, NFR-04, rủi ro R-01, R-02

## Bối cảnh
Khách có thể bấm nhiều lần, trình duyệt có thể gửi lại khi mạng chập chờn; nhiều khách có thể mua cùng một sản phẩm sắp hết. Hai lỗi không chấp nhận được: trừ tiền hai lần và bán vượt tồn kho.

## Quyết định
1. **Thanh toán**: header `Idempotency-Key` bắt buộc cho `POST /payments`, lưu trong `payments.idempotencyKey` có UNIQUE. Trong transaction, khoá dòng đơn bằng `SELECT … FOR UPDATE` (pessimistic) rồi kiểm tra lại key. Gửi lại cùng key trả kết quả cũ (200 + `Idempotent-Replayed: true`) mà không gọi cổng thanh toán.
2. **Tạo đơn**: `Idempotency-Key` (tuỳ chọn) với UNIQUE(userId, idempotencyKey).
3. **Tồn kho**: optimistic locking bằng cột `version`: `UPDATE … WHERE id = ? AND version = ? AND stock >= qty`, thử lại tối đa 8 lần, sắp xếp id để thứ tự khoá nhất quán; thiếu hàng trả 409 `OUT_OF_STOCK` và rollback cả đơn. Thêm `CHECK(stock >= 0)` làm lớp bảo vệ cuối.
4. **Cổng thanh toán** qua interface `charge()` (`MockPaymentGateway`) để thay adapter thật về sau.

## Lý do chọn hai kiểu khoá
Thanh toán xảy ra trên **một** đơn, ít tranh chấp, cần tuần tự tuyệt đối → khoá bi quan. Tồn kho bị nhiều đơn tranh chấp nhưng mỗi lần cập nhật rất ngắn → khoá lạc quan cho thông lượng tốt hơn, không giữ khoá lâu.

## Hệ quả
- Đã kiểm chứng: 12 khách tranh 5 ly ra đúng 5 đơn; 5 yêu cầu đồng thời cùng key chỉ tạo 1 đơn (INT-T15, INT-T18).
- Client phải sinh và giữ key tới khi nhận phản hồi dứt khoát (`apps/web/app/checkout/page.tsx`).
