# Sơ đồ BrewLite

Mã nguồn sơ đồ (sửa rồi vẽ lại): `*.mmd` (Mermaid) và `*.dot` (Graphviz); mô hình lớp chia thành class-domain và class-service; dùng mermaid-seq.json cho sơ đồ tuần tự. Kết quả: `*.pdf` (vector, dùng trong báo cáo) và `png/` (dùng cho slide).

    # Mermaid (cần @mermaid-js/mermaid-cli)
    mmdc -p pptr.json -c mermaid.json -i seq-pay.mmd -o seq-pay.pdf -f -b white
    # Graphviz
    dot -Tpdf usecase.dot -o usecase.pdf

Danh sách: usecase, dfd0, dfd1, activity-a, activity-b, seq-auth, seq-order, seq-pay, seq-cancel, seq-race, class, erd, state-order, state-payment, component, package, deployment, sitemap, scrum, roadmap.
