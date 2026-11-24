# Sprint 1

| Mục | Nội dung |
|---|---|
| Thời gian | 1 tuần · 28/10/2026 – 03/11/2026 |
| Sprint Goal | Tạo nền tảng kỹ thuật, tài liệu có kiểm soát phiên bản và một MVP đầu tiên chạy được cho luồng xem menu |
| Cam kết | S1-01 → S1-11, 27 SP ([backlog](product-backlog.md)) |
| Hoàn thành | 27/27 SP |

## Sprint Planning
- Chọn toàn bộ hạng mục Task 1 → 4 vì đề yêu cầu làm tuần tự: tài liệu Task 1–3 phải có trên repo trước khi nghiệm thu Sprint 1.
- Rủi ro chính: khối lượng tài liệu lớn với một người → dùng PlantUML (sơ đồ dạng văn bản, review được trong PR) và tái sử dụng mã Assignment 1 cho API/menu.

## Sprint Review (demo)
| Hạng mục | Kết quả demo | Minh chứng |
|---|---|---|
| Tài liệu Task 1–3 | `docs/requirements`, `docs/diagrams`, `docs/architecture` | commit theo thứ tự Task 1 → 4 trong lịch sử git |
| MVP menu | `docker compose up --build` → http://localhost:3000 hiển thị 8 đồ uống; tắt API thấy thông báo lỗi + Thử lại | FE-T01, INT-T01 |
| CI | PR chạy 2 job `api`/`web`: install → lint → unit test → build | PR thành công: https://github.com/kaiqwwp/brewlite/pulls?q=is:pr+head:docs/sprint-review · PR cố ý lỗi: https://github.com/kaiqwwp/brewlite/pulls?q=is:pr+head:demo/ci-fail |

Phản hồi của Product Owner (bản thân, đóng vai quản lý cửa hàng): tài liệu Task 1–3 đủ để hiểu phạm vi; trang Menu hiển thị đúng và báo lỗi rõ khi API tắt. Đề nghị Sprint 2 ưu tiên luồng đặt và thanh toán trên điện thoại.

## Sprint Retrospective
| Làm tốt | Cần cải thiện | Hành động cho Sprint 2 |
|---|---|---|
| Viết tiêu chí chấp nhận gắn mã test ngay từ SRS nên truy vết dễ | Assignment 1 dùng `synchronize`, không có migration | S2-08: chuyển sang migration TypeORM |
| Lint bắt được 2 import thừa trong mã cũ ngay lần chạy đầu | Chưa có test cho frontend | Giữ Vitest cho mọi component mới |
| Sơ đồ dạng văn bản review được trong PR | Chưa có môi trường production | S2-12: chọn Render + GHCR, viết `render.yaml` |
