# Definition of Done

Một hạng mục backlog chỉ được chuyển sang **Done** khi đạt đủ:

1. Mã nằm trên nhánh `feat/…` hoặc `fix/…`, được merge vào `main` qua pull request dùng mẫu PR.
2. CI xanh: lint, unit test, build (api, web), integration test, e2e, quét secret.
3. Có test tự động cho hành vi mới hoặc lỗi đã sửa; mã test được ghi trong [ma trận truy vết](../traceability-matrix.md).
4. Backend validate đầu vào và trả mã lỗi đúng (400/401/403/404/409/402); frontend có trạng thái loading, rỗng, lỗi.
5. Thay đổi schema có migration kèm `down()`, tương thích ngược với bản đang chạy.
6. Tài liệu liên quan (SRS, sơ đồ `.puml` + `.svg`, ADR, README) được cập nhật trong cùng PR, mô tả PR ghi lý do.
7. Không có secret trong mã, log hay ảnh chụp.
8. Sau khi merge, CD triển khai thành công và smoke test production đạt.
