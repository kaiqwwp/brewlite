# Sprint 1

| Mục | Nội dung |
|---|---|
| Thời gian | 1 tuần · *ghi ngày thật: __/__/2026 – __/__/2026* |
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
| CI | PR chạy 2 job `api`/`web`: install → lint → unit test → build | *dán link PR thành công và PR cố ý lỗi (docs/deployment.md mục 6)* |

Phản hồi của Product Owner (bản thân, đóng vai quản lý cửa hàng): *ghi phản hồi thật sau buổi review*.

## Sprint Retrospective
| Làm tốt | Cần cải thiện | Hành động cho Sprint 2 |
|---|---|---|
| Viết tiêu chí chấp nhận gắn mã test ngay từ SRS nên truy vết dễ | Assignment 1 dùng `synchronize`, không có migration | S2-08: chuyển sang migration TypeORM |
| Lint bắt được 2 import thừa trong mã cũ ngay lần chạy đầu | Chưa có test cho frontend | Giữ Vitest cho mọi component mới |
| Sơ đồ dạng văn bản review được trong PR | Chưa có môi trường production | S2-12: chọn Render + GHCR, viết `render.yaml` |
