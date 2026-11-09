# BrewLite – Ứng dụng đặt cà phê không dùng tiền mặt

Bài tập lớn môn **Công nghệ Phần mềm** (Trường ĐH Sài Gòn, HK I 2026–2027), thực hiện theo quy trình **Agile Scrum**.

> *"BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."*

| Thành phần | Công nghệ |
|---|---|
| Frontend (`frontend/`) | Next.js 14 (React, TypeScript), TailwindCSS, Zustand (giỏ hàng, đăng nhập) |
| Backend (`backend/`) | NestJS 10 (TypeScript), REST, class-validator, JWT (Passport), bcrypt |
| CSDL | PostgreSQL 16 + TypeORM |
| Thanh toán | Mock Payment Gateway (mô phỏng Momo/VNPay/Stripe) |
| DevOps | Docker Compose, Git |

## 1. Chạy nhanh bằng Docker Compose

Yêu cầu: Docker + Docker Compose v2.

```bash
docker compose up --build
```

- Frontend: <http://localhost:3000>
- API: <http://localhost:3001> (ví dụ `GET /products`)
- Lần chạy đầu, backend tự tạo bảng và nạp dữ liệu mẫu (8 đồ uống, 2 mã giảm giá, 1 tài khoản nhân viên).

Dừng: `docker compose down` (thêm `-v` để xóa dữ liệu).

Nếu mở web từ máy khác, đặt `NEXT_PUBLIC_API_URL=http://<ip-máy-chủ>:3001` rồi `docker compose up --build` lại (biến này được nhúng vào frontend lúc build).

## 2. Chạy thủ công (phát triển)

Yêu cầu: Node.js ≥ 20, PostgreSQL ≥ 14.

```bash
# 1) CSDL
createdb brewlite            # hoặc dùng: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=brewlite postgres:16-alpine

# 2) Backend  (http://localhost:3001)
cd backend
cp .env.example .env         # chỉnh DATABASE_URL nếu cần
npm install
npm run start:dev

# 3) Frontend (http://localhost:3000)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

## 3. Kiểm thử

Cần một CSDL PostgreSQL trống tên `brewlite_test` (test sẽ **xóa và tạo lại schema** của DB này).

```bash
createdb brewlite_test
cd backend
# mặc định: postgres://postgres:postgres@localhost:5432/brewlite_test ; đổi bằng biến TEST_DATABASE_URL
npm run test        # unit test (state machine, tính giá, khuyến mãi)
npm run test:e2e    # integration test qua HTTP + PostgreSQL thật
npm run test:all    # cả hai: 33 test
```

Các test chứng minh yêu cầu chấm điểm của **Task 10** (`backend/test/`):

| Tiêu chí | Test |
|---|---|
| (a) Chặn chuyển trạng thái sai | `unit/order-status.spec.ts` (đủ 49 cặp trạng thái) và `e2e/api.e2e.spec.ts` › *Order State Machine* |
| (b) Gửi 2 lần cùng `Idempotency-Key` chỉ tạo 1 đơn | `e2e` › *thanh toán / tạo đơn idempotent* (tuần tự và 5 request đồng thời) |
| (c) Đặt đồng thời không vượt tồn kho | `e2e` › *tồn kho khi đặt đồng thời* (12 khách tranh 5 sản phẩm → đúng 5 đơn) |

## 4. Tài khoản & dữ liệu mẫu

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng | tự đăng ký tại `/register` | tối thiểu 6 ký tự |
| Nhân viên quầy (phần mở rộng) | `staff@brewlite.local` | `staff123` |

Mã giảm giá: `BREW10` (giảm 10%, tối đa 20.000đ), `WELCOME20` (giảm 20% cho đơn từ 100.000đ, tối đa 50.000đ).
Điểm thưởng: 1 điểm cho mỗi 10.000đ của đơn đã thanh toán.
Ở màn hình thanh toán có ô *"Mô phỏng thanh toán lỗi"* để demo luồng `PAYMENT_FAILED` → thử lại.

## 5. API

| Endpoint | Chức năng | Auth |
|---|---|---|
| `GET /products` | Danh sách menu (id, tên, giá, ảnh) | – |
| `GET /products/:id` | Chi tiết + tuỳ chọn size/topping | – |
| `POST /auth/register` | Đăng ký (mật khẩu băm bcrypt), trả JWT | – |
| `POST /auth/login` | Đăng nhập, trả JWT | – |
| `GET /auth/me` | Thông tin tài khoản + điểm thưởng | JWT |
| `POST /orders` | Tạo đơn `PENDING`, giữ kho, áp mã giảm giá. Hỗ trợ header `Idempotency-Key` | JWT |
| `POST /payments` | Thanh toán (Ví/Thẻ), **bắt buộc** header `Idempotency-Key`. `201` thành công, `200` phát lại, `402` thất bại | JWT |
| `GET /orders/me` | Lịch sử đơn của tôi | JWT |
| `GET /orders/:id` | Chi tiết một đơn (chủ đơn hoặc nhân viên) | JWT |
| `POST /orders/:id/cancel` | Hủy đơn (PENDING/PAYMENT_FAILED/PAID), hoàn kho | JWT |
| `PATCH /orders/:id/status` | Nhân viên chuyển `PREPARING → READY → COMPLETED` | JWT + STAFF |

Ví dụ:

```bash
TOKEN=$(curl -s localhost:3001/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"staff@brewlite.local","password":"staff123"}' | jq -r .accessToken)
curl -s localhost:3001/orders -H "Authorization: Bearer $TOKEN" -H 'Idempotency-Key: demo-1' \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":3,"size":"L","toppings":["PEARL"],"qty":2}],"couponCode":"BREW10"}'
```

## 6. Nghiệp vụ backend (Task 10)

1. **Order State Machine** – `backend/src/orders/order-status.ts`. `PENDING → PAID → PREPARING → READY → COMPLETED`; ngoại lệ `PAYMENT_FAILED` (thử lại về `PENDING`) và `CANCELLED`. Mọi chuyển tiếp đi qua `assertTransition`, rồi `UPDATE ... WHERE status = <trạng thái hiện tại>` để hai request đồng thời không thể cùng chuyển một đơn.
2. **Thanh toán idempotent** – `payments.service.ts`. `Idempotency-Key` có ràng buộc `UNIQUE`; khóa dòng đơn (`SELECT ... FOR UPDATE`) để các request đồng thời trên một đơn xử lý tuần tự; gửi lại cùng key trả đúng kết quả cũ (`Idempotent-Replayed: true`).
3. **Tồn kho đồng thời** – `stock.service.ts`. Transaction + optimistic locking bằng cột `version`: chỉ trừ kho khi `version` chưa đổi và `stock` đủ, nếu không thì đọc lại và thử lại; thiếu hàng trả `409 OUT_OF_STOCK` và rollback toàn bộ đơn.
4. **Khuyến mãi & loyalty** – `promotions.service.ts`. Kiểm tra mã (còn hiệu lực, hết hạn, đơn tối thiểu, trần giảm); cộng điểm đúng một lần khi đơn chuyển `PAID`.

## 7. Cấu trúc thư mục

```
brewlite/
├── backend/            # NestJS API (src/, test/, Dockerfile)
├── frontend/           # Next.js UI (app/, components/, lib/, Dockerfile)
├── docs/               # ảnh chụp màn hình, kết quả test
├── report/             # báo cáo LaTeX (Assignment_report.tex → PDF)
├── docker-compose.yml  # db + backend + frontend
└── README.md
```

## 8. Ghi chú kỹ thuật

- Giá luôn được **server tính lại** từ giá gốc + size + topping; client không thể gửi giá.
- `DB_SYNC=true` (mặc định) để tự tạo bảng cho tiện demo; môi trường thật nên dùng migration và đặt `JWT_SECRET` riêng.
- Kho được **giữ ngay khi tạo đơn** và hoàn lại khi hủy đơn.
- Chức năng nhân viên quầy (cập nhật trạng thái pha chế) chỉ có ở API, ngoài phạm vi MVP.
