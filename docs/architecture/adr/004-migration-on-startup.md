# ADR-004: Chạy migration khi API khởi động, trong một transaction

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-18
- Liên quan: Task 5.3 bước 5 (chạy migration an toàn), NFR-07, rủi ro R-06

## Bối cảnh
Pipeline phải chạy migration an toàn khi triển khai. Gói miễn phí của Render không có “pre-deploy command”, còn CSDL production không mở ra Internet nên runner GitHub không kết nối trực tiếp được (và cũng không nên).

## Quyết định
- API bật `migrationsRun` với `migrationsTransactionMode: 'all'`: khi container mới khởi động, mọi migration chưa chạy được áp dụng trong **một** transaction PostgreSQL (PostgreSQL hỗ trợ DDL trong transaction).
- Migration lỗi → rollback toàn bộ, tiến trình thoát, `/health` không bao giờ trả 200, Render không chuyển traffic sang bản mới và giữ bản cũ đang chạy. Pipeline CD thấy smoke test không đạt phiên bản mong đợi và chạy bước rollback.
- Quy tắc viết migration **tương thích ngược** (expand/contract): thêm cột nullable hoặc có default, không đổi tên/xoá cột trong cùng lần phát hành với code dùng nó. Nhờ vậy rollback image về bản trước vẫn chạy với schema mới.
- Khi thật sự cần hoàn tác schema: Render → `brewlite-api` → Shell → `npm run migration:revert:prod` (từng migration một), ghi vào release notes.

## Hệ quả
- Không cần bước migration thủ công; mọi bản triển khai tự đưa schema về đúng phiên bản code.
- Nếu sau này chạy nhiều instance, nhiều tiến trình có thể cùng thử migration; TypeORM giữ bảng `migrations` trong cùng transaction nên chỉ một bên thành công, nhưng nên chuyển sang job migration riêng (pre-deploy) khi nâng gói.
