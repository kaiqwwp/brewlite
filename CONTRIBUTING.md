# Quy ước làm việc

## Nhánh và pull request (GitHub Flow)
- `main`: luôn triển khai được; được bảo vệ (bắt buộc PR, bắt buộc CI xanh, không push thẳng). Mỗi lần merge vào `main` là một lần triển khai production.
- Nhánh làm việc tách từ `main`: `feat/<issue>-<mô-tả>`, `fix/<issue>-<mô-tả>`, `docs/<mô-tả>`, `ci/<mô-tả>`, `chore/<mô-tả>`. Ví dụ `feat/12-loyalty-history`.
- Mở PR theo mẫu `.github/pull_request_template.md`, liên kết issue (`Closes #12`). Thay đổi `docs/requirements`, `docs/diagrams`, `docs/architecture` phải ghi lý do trong PR.
- Merge bằng **Squash and merge**; tiêu đề commit squash theo quy ước bên dưới. Xoá nhánh sau khi merge.
- Phát hành: tag có chú thích `vMAJOR.MINOR.PATCH` (Semantic Versioning) trên `main` + release notes trong `docs/releases/`.

## Quy ước commit (Conventional Commits)
```
<type>(<scope>): <mô tả ngắn, thể mệnh lệnh>

<thân: vì sao thay đổi>

Refs: FR-07, #12
```
- `type`: `feat`, `fix`, `docs`, `test`, `refactor`, `ci`, `build`, `chore`, `perf`.
- `scope` gợi ý: `api`, `web`, `db`, `e2e`, `task1`…`task5`, `deps`.
- Ví dụ: `feat(api): ghi LoyaltyTransaction khi cộng/thu hồi điểm`, `docs(task2): thêm sequence diagram UC-05`, `ci: thêm job e2e Playwright`.

## Definition of Done
Xem [docs/process/definition-of-done.md](docs/process/definition-of-done.md).

## Chạy kiểm tra trước khi mở PR
```bash
npm run lint            # ESLint + tsc cho api và web
npm test                # unit test api + web
npm run test:integration   # cần PostgreSQL local, DB brewlite_test
npm run build
npm run test:e2e        # cần hệ thống đang chạy (docker compose up --build)
```
