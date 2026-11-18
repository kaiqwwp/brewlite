# ADR-007: Xác thực bằng JWT Bearer, mật khẩu bcrypt

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-18
- Liên quan: FR-04, NFR-03, NFR-05

## Bối cảnh
Web và API chạy ở hai origin khác nhau trên Render (`brewlite-web.onrender.com`, `brewlite-api.onrender.com`). Cần xác thực không trạng thái, đơn giản.

## Quyết định
- Mật khẩu băm bcrypt cost 10. Đăng nhập trả JWT HS256 ký bằng `JWT_SECRET` (≥ 32 ký tự ở production, sinh ngẫu nhiên bởi Render), hết hạn 1 ngày (`JWT_EXPIRES_IN`).
- Client gửi `Authorization: Bearer <token>`; `JwtAuthGuard` bảo vệ route, `RolesGuard` + `@Roles('STAFF')` cho API nhân viên.
- Token lưu trong localStorage (Zustand persist). 401 → client tự đăng xuất.
- CORS chỉ cho origin trong `CORS_ORIGIN`.

## Hệ quả
- Không cần cookie cross-site hay CSRF token.
- Rủi ro: XSS có thể đọc token. Giảm thiểu: React tự escape, không dùng `dangerouslySetInnerHTML`, token hết hạn 1 ngày. Hướng cải tiến (backlog): cookie HttpOnly + refresh token xoay vòng.
