#!/usr/bin/env bash
# Tạo label, milestone Sprint 1/2 và issue backlog trên GitHub từ docs/process/product-backlog.md.
# Cần: gh CLI đã đăng nhập (gh auth login), chạy trong thư mục repo đã có remote GitHub.
# Chạy một lần: bash scripts/create-github-backlog.sh
set -euo pipefail
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repo: $REPO"

for l in "user-story:1d76db" "bug:d73a4a" "docs:0e8a16" "ci-cd:5319e7" "sprint-1:fbca04" "sprint-2:f9d0c4"; do
  gh label create "${l%%:*}" --color "${l##*:}" --force >/dev/null
done

ms() { gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null 2>&1 || true; }
ms "Sprint 1" "Nền tảng kỹ thuật, tài liệu Task 1-3, MVP xem menu, CI"
ms "Sprint 2" "Luồng end-to-end, CI/CD, production"

issue() { # $1 milestone, $2 labels, $3 title, $4 body, $5 state (open|closed)
  local url
  url=$(gh issue create --title "$3" --body "$4" --label "$2" --milestone "$1")
  [ "$5" = closed ] && gh issue close "$url" --reason completed >/dev/null
  echo "  $3 → $url"
}

echo "Sprint 1"
issue "Sprint 1" "docs,sprint-1" "S1-01 Bối cảnh, stakeholder, phạm vi" "Task 1.1 · docs/requirements/context-and-scope.md · 2 SP" closed
issue "Sprint 1" "docs,sprint-1" "S1-02 SRS: FR, NFR, MoSCoW, use-case tổng quát" "Task 1.2 · docs/requirements/srs.md · 3 SP" closed
issue "Sprint 1" "docs,sprint-1" "S1-03 Đặc tả UC-05 Đặt và thanh toán" "Task 1.3 · docs/requirements/use-case-checkout.md · 2 SP" closed
issue "Sprint 1" "docs,sprint-1" "S1-04 Activity, sequence, class diagram" "Task 2 · docs/diagrams · 3 SP" closed
issue "Sprint 1" "docs,sprint-1" "S1-05 Kiến trúc C4 + ADR" "Task 3.1 · docs/architecture · 3 SP" closed
issue "Sprint 1" "docs,sprint-1" "S1-06 Deployment diagram production" "Task 3.2 · 2 SP" closed
issue "Sprint 1" "ci-cd,sprint-1" "S1-07 Thiết lập repo, convention, DoD" "Task 4.1 · 2 SP" closed
issue "Sprint 1" "user-story,sprint-1" "S1-08 API GET /products, /products/:id + seed" "FR-01, FR-02 · 2 SP" closed
issue "Sprint 1" "user-story,sprint-1" "S1-09 Màn hình Menu mobile-first (loading/empty/error)" "FR-01 · 3 SP" closed
issue "Sprint 1" "user-story,sprint-1" "S1-10 Test API và component Menu" "FE-T01, INT-T01 · 2 SP" closed
issue "Sprint 1" "ci-cd,sprint-1" "S1-11 CI install → lint → unit test → build" "Task 4.4 · 3 SP. Bật branch protection cho main." open

echo "Sprint 2"
issue "Sprint 2" "user-story,sprint-2" "S2-01..06 Hoàn thiện MVP (chi tiết, giỏ, JWT, đơn, thanh toán, lịch sử)" "Task 5.1 · FR-02…FR-09 · 14 SP" closed
issue "Sprint 2" "user-story,sprint-2" "S2-07 Validate và xử lý lỗi FE/BE" "1 SP" closed
issue "Sprint 2" "user-story,sprint-2" "S2-08 Migration, Promotion, LoyaltyTransaction" "Task 5.2 · FR-12 · 3 SP" closed
issue "Sprint 2" "user-story,sprint-2" "S2-09 Health, log, config" "Task 5.2 · NFR-07, NFR-09 · 2 SP" closed
issue "Sprint 2" "user-story,sprint-2" "S2-10 Integration + E2E test" "Task 5.2 · 3 SP" closed
issue "Sprint 2" "user-story,sprint-2" "S2-11 PWA" "FR-13 · 2 SP" closed
issue "Sprint 2" "ci-cd,sprint-2" "S2-12 CD: GHCR → Render → smoke test → rollback" "Task 5.3 · 5 SP. Tạo Blueprint Render và secret." open
issue "Sprint 2" "docs,sprint-2" "S2-13 Release v2.0.0, video, Review/Retro" "Task 5.4 · 2 SP" open
echo "Xong. Tạo Project board: gh project create --owner @me --title 'BrewLite' rồi thêm các issue (hoặc dùng giao diện GitHub → Projects)."
