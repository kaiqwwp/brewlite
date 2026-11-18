# Task 1.1 – Bối cảnh, stakeholder và phạm vi

| Thuộc tính | Giá trị |
|---|---|
| Sản phẩm | BrewLite – ứng dụng đặt và thanh toán đồ uống không tiền mặt |
| Phiên bản tài liệu | 2.0 (Assignment 2) |
| Người viết | Lâm Sơn Hùng (3123560031) – một người kiêm Product Owner, Scrum Master, Developer |
| Liên quan | [srs.md](srs.md), [use-case-checkout.md](use-case-checkout.md), [../traceability-matrix.md](../traceability-matrix.md) |

## 1. Vấn đề nghiệp vụ

Quán cà phê nhỏ vào giờ cao điểm (7h–9h, 11h30–13h) thường có hàng dài trước quầy. Mỗi khách mất 1–3 phút để đọc menu, gọi món, chờ tính tiền và trả tiền mặt hoặc quét mã. Hậu quả:

- Khách bỏ về khi thấy hàng dài, quán mất doanh thu.
- Nhân viên quầy vừa nhận order vừa thu tiền, dễ ghi nhầm món, size, topping hoặc thối nhầm tiền.
- Quán không có dữ liệu đơn hàng và không có chương trình khách hàng thân thiết.

**BrewLite** cho khách xem menu, chọn size/topping, đặt và thanh toán trước bằng ví điện tử hoặc thẻ trên điện thoại, rồi chỉ việc tới quầy nhận đồ uống. Nhân viên chỉ cần pha chế và cập nhật trạng thái đơn.

**Product Vision:** “BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.”

## 2. Stakeholder

| Stakeholder | Vai trò | Mục tiêu | Kỳ vọng với hệ thống | Mức ảnh hưởng |
|---|---|---|---|---|
| Khách hàng | Người dùng chính, đặt và trả tiền | Mua nhanh, không xếp hàng, không mang tiền mặt | Menu rõ giá; chọn size/topping dễ; thanh toán an toàn, không bị trừ tiền hai lần; biết khi nào đơn sẵn sàng; dùng tốt trên điện thoại | Cao |
| Nhân viên quầy (barista) | Nhận và pha chế đơn | Biết đơn nào đã trả tiền, pha đúng món | Danh sách đơn đã thanh toán đúng size/topping; đổi trạng thái PREPARING → READY → COMPLETED | Trung bình |
| Quản lý cửa hàng | Product Owner phía khách hàng | Tăng doanh thu giờ cao điểm, giữ khách quay lại | Không bán vượt tồn kho; mã khuyến mãi và điểm thưởng tính đúng; dữ liệu đơn hàng lưu lại | Cao |
| Giảng viên / khách hàng nghiệm thu | Nghiệm thu theo đề | Đánh giá quy trình và sản phẩm | Tạo phẩm đúng thứ tự Task 1→5; truy vết được; URL production chạy; CI/CD hoạt động | Cao |
| Nhóm phát triển (1 người) | PO, SM, Dev | Hoàn thành đúng hạn, chất lượng | Yêu cầu rõ, có tiêu chí chấp nhận; pipeline tự động; triển khai lặp lại được | Cao |
| Đơn vị thanh toán (Momo/VNPay/ngân hàng) | Hệ thống ngoài | Xử lý giao dịch | Mỗi giao dịch có mã định danh; yêu cầu lặp không bị tính tiền hai lần | Trung bình (MVP dùng cổng mô phỏng) |

## 3. Phạm vi

### 3.1 Trong MVP (in-scope)

| # | Hạng mục | Mã yêu cầu |
|---|---|---|
| 1 | Xem menu (tên, ảnh, giá, hết hàng) với trạng thái loading / empty / error | FR-01 |
| 2 | Xem chi tiết sản phẩm, chọn size S/M/L và topping, giá cập nhật tức thì | FR-02 |
| 3 | Giỏ hàng: thêm, gộp món trùng, đổi số lượng, xoá, tính tổng, lưu khi tải lại trang | FR-03 |
| 4 | Đăng ký, đăng nhập bằng email/mật khẩu, phiên bằng JWT | FR-04 |
| 5 | Đặt đơn: server tính lại giá, áp mã giảm giá, giữ tồn kho, chống tạo đơn trùng | FR-05, FR-06 |
| 6 | Thanh toán mô phỏng bằng Ví điện tử hoặc Thẻ, idempotent, thử lại khi lỗi | FR-07 |
| 7 | Xác nhận đơn, trạng thái đơn, lịch sử đơn của tôi | FR-08, FR-09 |
| 8 | Quản lý trạng thái đơn theo state machine; khách hủy đơn chưa pha chế; nhân viên cập nhật pha chế qua API | FR-10, FR-11 |
| 9 | Điểm thưởng: cộng khi thanh toán, thu hồi khi hủy, xem số dư và lịch sử | FR-12 |
| 10 | PWA: cài lên màn hình chính, trang ngoại tuyến | FR-13 |
| 11 | Health check, log, CI/CD, triển khai production qua HTTPS | NFR-06 → NFR-10 |

### 3.2 Phạm vi mở rộng (sau MVP, đã ghi vào backlog)

- Giao diện cho nhân viên quầy (hiện chỉ có API `PATCH /orders/:id/status`).
- Tích hợp cổng thanh toán thật (Momo, VNPay) với webhook, hoàn tiền khi hủy đơn đã thanh toán.
- Thông báo thời gian thực khi đơn READY (WebSocket hoặc Web Push).
- Đơn PENDING tự hết hạn sau 15 phút và nhả tồn kho.
- Giỏ hàng lưu theo tài khoản; refresh token và cookie HttpOnly thay cho localStorage.
- Trang quản trị menu, tồn kho và mã khuyến mãi.

### 3.3 Không thực hiện (out-of-scope)

| Nội dung | Lý do |
|---|---|
| Giao hàng tận nơi, theo dõi shipper | Ngoài bài toán “nhận tại quầy” |
| Thanh toán tiền mặt | Trái với mục tiêu không tiền mặt |
| Nhiều chi nhánh, nhiều cửa hàng | MVP phục vụ một quán |
| Ứng dụng native iOS/Android | Thay bằng PWA (đề yêu cầu Next.js mobile-first/PWA) |
| Quản lý nguyên liệu, kế toán, báo cáo doanh thu | Thuộc hệ thống POS/ERP riêng |
| Lưu thông tin thẻ của khách | Không cần với cổng mô phỏng; tránh phạm vi PCI DSS |

## 4. Giả định

| Mã | Giả định |
|---|---|
| A-01 | Khách có điện thoại thông minh với trình duyệt hiện đại (Chrome, Safari, Edge bản 2 năm gần nhất) và có Internet. |
| A-02 | Một quán, một menu; tồn kho tính theo số ly bán được của từng sản phẩm. |
| A-03 | Cổng thanh toán mô phỏng hành xử như cổng thật: trả kết quả thành công/thất bại đồng bộ, mỗi yêu cầu có mã tham chiếu. |
| A-04 | Nhân viên quầy dùng API (hoặc công cụ như Postman) để cập nhật trạng thái pha chế trong MVP. |
| A-05 | Lưu lượng MVP nhỏ (dưới 50 người dùng đồng thời), đủ cho gói miễn phí của nền tảng triển khai. |

## 5. Ràng buộc

| Mã | Ràng buộc |
|---|---|
| C-01 | Bắt buộc dùng Next.js (frontend, mobile-first/PWA), NestJS (backend), PostgreSQL (CSDL); không được thay thế. |
| C-02 | Quy trình Agile Scrum, 2 Sprint cho Assignment 2; 5 task thực hiện tuần tự, task sau chỉ nghiệm thu khi tạo phẩm của task trước đã có trên repository. |
| C-03 | Nhóm 1 người; ngân sách hạ tầng 0 đồng (dùng gói miễn phí: GitHub Actions, GHCR, Render). |
| C-04 | Mọi thay đổi yêu cầu, sơ đồ, kiến trúc đi qua commit/pull request có lý do. |
| C-05 | Secret (JWT_SECRET, mật khẩu CSDL, deploy hook) không được nằm trong repository hay log CI. |
| C-06 | Ứng dụng giao tiếp tiếng Việt, tiền tệ VND, múi giờ Asia/Ho_Chi_Minh. |

## 6. Rủi ro ban đầu

| Mã | Rủi ro | Khả năng | Ảnh hưởng | Biện pháp |
|---|---|---|---|---|
| R-01 | Khách bấm thanh toán nhiều lần hoặc mất mạng giữa chừng gây trừ tiền hai lần | Cao | Cao | Idempotency-Key bắt buộc, ràng buộc UNIQUE, khoá dòng đơn (NFR-04) |
| R-02 | Nhiều khách đặt cùng lúc sản phẩm sắp hết gây bán vượt tồn kho | Trung bình | Cao | Optimistic locking (cột `version`), CHECK `stock >= 0`, rollback cả đơn |
| R-03 | Một người làm cả đồ án, khối lượng lớn, dễ trễ hạn | Cao | Cao | Ưu tiên MoSCoW, Must trước; tự động hoá kiểm thử và triển khai |
| R-04 | Gói miễn phí của Render: dịch vụ “ngủ” sau 15 phút không dùng (khởi động lại khoảng 1 phút); Postgres miễn phí hết hạn sau 30 ngày | Cao | Trung bình | Smoke test có thử lại; mở URL trước buổi chấm; ghi rõ trong [deployment.md](../deployment.md) cách tạo lại CSDL |
| R-05 | Lộ secret khi commit hoặc in ra log | Thấp | Cao | `.env` trong `.gitignore`, gitleaks trong CI, secret chỉ ở GitHub Secrets và Render |
| R-06 | Migration lỗi làm hỏng CSDL production | Thấp | Cao | Mọi migration chạy trong một transaction; health check chặn bản lỗi; có lệnh revert (ADR-004) |
| R-07 | Giá trên giao diện lệch giá server (giá đổi khi khách đang xem giỏ) | Trung bình | Trung bình | Server luôn tính lại giá; giao diện so tổng và yêu cầu khách xác nhận giá mới (lỗi F04 đã sửa) |
