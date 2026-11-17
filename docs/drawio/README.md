# Sơ đồ BrewLite dạng draw.io (chỉnh sửa được)

21 file `.drawio` tương ứng 21 sơ đồ trong báo cáo (cùng tên với thư mục `report/diagrams/`).

## Cách mở
1. Vào https://app.diagrams.net (hoặc cài draw.io Desktop).
2. **File → Open from → Device**, chọn file `.drawio` (hoặc kéo thả file vào trình duyệt).
3. Chỉnh sửa, rồi **File → Export as → PNG / PDF / SVG** để chèn vào báo cáo.

## Danh sách
| Nhóm | File |
|---|---|
| Use Case | `usecase` |
| DFD | `dfd0` (mức 0), `dfd1` (mức 1) |
| Activity | `activity-a`, `activity-b` |
| Sequence | `seq-auth`, `seq-order`, `seq-pay`, `seq-cancel`, `seq-race` |
| Class | `class-domain`, `class-service` |
| ERD | `erd` |
| State machine | `state-order` (đơn hàng, mục 9.1 của đề), `state-payment` |
| Kiến trúc | `component`, `package`, `deployment` |
| Khác | `sitemap`, `scrum`, `roadmap` |

## Ghi chú
- Các file được sinh tự động từ nguồn `.dot` / `.mmd` (script trong `tools/`), nên nội dung giống hệt sơ đồ trong báo cáo; bố cục ban đầu do Graphviz tính, có thể kéo thả cho đẹp hơn.
- Chạy lại: `python3 tools/build_drawio.py ../../report/diagrams out`.
- `tools/preview.py` chỉ là bản xem thử thô để kiểm tra nhanh, không phải bản xuất chính thức.
