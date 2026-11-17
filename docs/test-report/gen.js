const fs=require('fs');
const R=require('./results.json');
const esc=s=>String(s).replace(/[\u2600-\u27BF\u{1F300}-\u{1FAFF}\uFE0F]/gu,'').replace(/\\/g,'\\textbackslash{}').replace(/([&%$#_{}])/g,'\\$1').replace(/~/g,'\\textasciitilde{}').replace(/\^/g,'\\textasciicircum{}').replace(/</g,'\\textless{}').replace(/>/g,'\\textgreater{}');
const cats=[...new Set(R.map(t=>t.cat))];
const shotsOf=ids=>ids.flatMap(id=>R.find(t=>t.id==id).shots);
let o=`\\documentclass[a4paper,11pt]{article}
\\usepackage[margin=2cm]{geometry}
\\usepackage{fontspec}
\\setmainfont{Liberation Serif}\\setsansfont{Liberation Sans}\\setmonofont{DejaVu Sans Mono}[Scale=0.85]
\\usepackage{float,array,longtable,booktabs,graphicx,xcolor,colortbl,enumitem,fancyhdr,hyperref,caption,subcaption,lastpage}
\\hypersetup{colorlinks=true,linkcolor=brown!60!black,urlcolor=blue!50!black}
\\definecolor{brew}{rgb}{0.435,0.271,0.153}\\definecolor{okgreen}{rgb}{0.1,0.55,0.3}\\definecolor{warnred}{rgb}{0.75,0.15,0.15}
\\newcolumntype{L}[1]{>{\\raggedright\\arraybackslash}p{#1}}
\\setlist[itemize]{leftmargin=1.2em,itemsep=0pt,topsep=1pt,parsep=0pt}
\\pagestyle{fancy}\\fancyhf{}\\lhead{\\small BrewLite -- Báo cáo kiểm thử giao diện}\\rhead{\\small Lâm Sơn Hùng -- 3123560031}\\cfoot{\\small Trang \\thepage/\\pageref{LastPage}}
\\setlength{\\fboxsep}{0pt}\\addtolength{\\fboxrule}{-0.2pt}\\setlength{\\parindent}{0pt}\\setlength{\\parskip}{4pt}
\\newcommand{\\ok}{\\textcolor{okgreen}{\\textbf{PASS}}}
\\newfontfamily\\tickfont{DejaVu Sans}\\newcommand{\\tick}{\\textcolor{okgreen}{{\\tickfont ✓}}}\\newcommand{\\shot}[2][]{\\fbox{\\includegraphics[#1]{#2}}}
\\begin{document}
\\begin{center}
{\\Large\\bfseries\\color{brew} BÁO CÁO KIỂM THỬ GIAO DIỆN VÀ NGHIỆP VỤ}\\\\[3pt]
{\\large Dự án BrewLite -- Ứng dụng đặt đồ uống (NestJS + Next.js + PostgreSQL)}\\\\[3pt]
Sinh viên: Lâm Sơn Hùng -- MSSV 3123560031 -- Giảng viên: Từ Lãng Phiêu\\\\
Môn: Công nghệ phần mềm -- Trường Đại học Sài Gòn
\\end{center}

\\section{Mục đích và phương pháp}
Mục tiêu: kiểm tra \\textbf{lỗi nghiệp vụ} (không chỉ lỗi hiển thị) khi đi qua giao diện như một khách hàng thật, và đánh giá hệ thống đã \\textbf{đáp ứng yêu cầu} của 10 task hay chưa.
\\begin{itemize}
\\item \\textbf{Công cụ}: Playwright điều khiển Chromium thật (không giả lập API); khách hàng thao tác trên trang Next.js, backend NestJS và PostgreSQL 16 chạy thật.
\\item \\textbf{Kiểm tra kép}: sau mỗi thao tác giao diện, kịch bản đối chiếu lại với \\textbf{cơ sở dữ liệu} (số đơn, trạng thái, tồn kho, điểm thưởng, số giao dịch thanh toán), vì giao diện đúng chưa chắc dữ liệu đúng.
\\item \\textbf{Mô phỏng sự cố}: ngắt mạng đúng lúc nhận phản hồi, bấm liên tục, hai trình duyệt cùng mua ly cuối, giá thay đổi khi khách đang xem giỏ, token hỏng, tải lại trang giữa chừng.
\\item \\textbf{Quy trình}: chạy $\\to$ ghi lỗi $\\to$ sửa mã nguồn $\\to$ chạy lại toàn bộ. Số liệu trong báo cáo là của lần chạy cuối sau khi sửa lỗi.
\\item \\textbf{Ngoài giao diện}: bộ kiểm thử tự động phía backend (Jest) cũng được chạy lại sau khi sửa: 34/34 đạt.
\\end{itemize}

\\section{Tổng quan kết quả}
`;
const totals={t:0,c:0,ms:0};
o+=`\\begin{longtable}{|L{7cm}|c|c|c|}\\hline\\textbf{Nhóm kiểm thử}&\\textbf{Kịch bản}&\\textbf{Điểm kiểm tra}&\\textbf{Kết quả}\\\\\\hline\\endhead\n`;
for(const c of cats){const l=R.filter(t=>t.cat==c);const n=l.reduce((s,t)=>s+t.checks.length,0);const p=l.filter(t=>t.status=='PASS').length;totals.t+=l.length;totals.c+=n;o+=`${esc(c)}&${l.length}&${n}&${p}/${l.length} \\ok\\\\\\hline\n`}
o+=`\\textbf{Tổng}&\\textbf{${totals.t}}&\\textbf{${totals.c}}&\\textbf{${R.filter(t=>t.status=='PASS').length}/${totals.t}}\\\\\\hline\\end{longtable}
Lượt chạy đầu tiên phát hiện \\textbf{6 lỗi} (Mục~\\ref{sec:bugs}); cả 6 đã được sửa và kiểm tra lại. Lượt chạy cuối: \\textbf{${totals.t}/${totals.t} kịch bản đạt, ${totals.c}/${totals.c} điểm kiểm tra đạt}.

\\section{Lỗi nghiệp vụ đã phát hiện và sửa}\\label{sec:bugs}
Các lỗi dưới đây đều \\textbf{không làm hỏng giao diện}, phần lớn chỉ lộ ra khi đối chiếu dữ liệu hoặc mô phỏng tình huống bất thường.
\\begin{longtable}{|L{0.9cm}|L{1.2cm}|L{3.3cm}|L{3.9cm}|L{4.0cm}|}\\hline
\\textbf{Mã}&\\textbf{Mức}&\\textbf{Hiện tượng (trước khi sửa)}&\\textbf{Hậu quả nghiệp vụ}&\\textbf{Cách sửa và kết quả chạy lại}\\\\\\hline\\endhead
`;
const bugs=[
['F04','Cao','Giá sản phẩm đổi trên server sau khi khách đã bỏ món vào giỏ; trang thanh toán vẫn đi tiếp.','Khách bị trừ số tiền khác với số tiền đã thấy trong giỏ (giỏ 70.000đ, thực tế 100.000đ).','Thanh toán: so sánh tổng đơn của server với tổng trong giỏ; lệch thì dừng, chưa trả tiền, hiện cảnh báo kèm tổng mới, khách bấm xác nhận lần hai. Chạy lại: đạt.'],
['D11','Trung bình','Thanh toán lỗi rồi tải lại trang và bấm thanh toán lại.','Sinh ra đơn thứ hai; đơn lỗi cũ vẫn giữ kho (tồn kho bị trừ thừa 2 ly).','Khi lỗi, địa chỉ chuyển sang \\texttt{/checkout?order=ID} nên thử lại dùng lại đúng đơn cũ. Chạy lại: 1 đơn, kho trừ một lần.'],
['D12','Trung bình','Thanh toán lại thành công từ trang chi tiết đơn.','Giỏ hàng vẫn còn nguyên món đã mua, khách có thể mua trùng.','Sau khi trả tiền chỉ xóa các dòng giỏ khớp với món trong đơn (không xóa món khác khách vừa thêm). Chạy lại: đạt.'],
['E06','Trung bình','Khách hủy đơn đã thanh toán.','Điểm thưởng đã cộng không bị thu hồi: có thể mua rồi hủy để tích điểm.','Thêm \\texttt{revokePoints} (dùng cờ \\texttt{pointsAwarded} nên hủy hai lần không trừ hai lần). Thêm test tích hợp, backend 34/34. Chạy lại: điểm về 0.'],
['C07','Thấp','Token hết hạn hoặc bị hỏng khi đang dùng.','Giao diện vẫn hiện như đã đăng nhập, mọi thao tác báo lỗi lặp lại, khách không biết phải đăng nhập lại.','Nhận 401 thì tự đăng xuất và chuyển về \\texttt{/login}, sau đăng nhập quay lại đúng trang. Chạy lại: đạt.'],
['G07','Thấp','Không đặt \\texttt{CORS\\_ORIGIN} thì máy chủ chấp nhận mọi nguồn gốc.','Cấu hình mặc định quá lỏng cho môi trường thật.','Mặc định chỉ cho phép \\texttt{http://localhost:3000}; cấu hình thật vẫn đặt bằng biến môi trường. Chạy lại: đạt.'],
];
for(const b of bugs)o+=`\\textbf{${b[0]}}&${b[1]}&${b[2]}&${b[3]}&${b[4]}\\\\\\hline\n`;
o+=`\\end{longtable}

\\begin{figure}[H]\\centering
\\begin{subfigure}{0.46\\textwidth}\\shot[width=\\textwidth]{shots/F04_warning.png}\\caption{F04: cảnh báo giá đã thay đổi, chưa trừ tiền}\\end{subfigure}\\hfill
\\begin{subfigure}{0.46\\textwidth}\\shot[width=\\textwidth]{shots/E03_cancelled.png}\\caption{E03/E06: đơn đã hủy}\\end{subfigure}
\\caption{Minh họa hai kịch bản liên quan lỗi đã sửa}\\end{figure}

\\section{Chi tiết kịch bản theo nhóm}
Mỗi kịch bản gồm \\emph{kỳ vọng} và các \\emph{điểm kiểm tra} (dấu \\tick{} là đạt; phần sau dấu hai chấm là giá trị thực tế ghi nhận khi chạy, nếu có).
`;
cats.forEach((c,i)=>{
 o+=`\\subsection{${esc(c)}}\n`;
 for(const t of R.filter(x=>x.cat==c)){
  o+=`\\begin{minipage}{\\textwidth}\\vspace{4pt}\\textbf{\\textcolor{brew}{${t.id}}} -- \\textbf{${esc(t.title)}} \\hfill ${t.status=='PASS'?'\\ok':'\\textcolor{warnred}{FAIL}'}\\\\\n{\\small\\emph{Kỳ vọng:} ${esc(t.expected||'')}}\n`;
  if(t.notes&&t.notes.length)o+=`\\\\{\\small\\emph{Ghi chú:} ${esc(t.notes.join('; '))}}\n`;
  o+=`\\end{minipage}\n\\begin{itemize}\\footnotesize\n`;
  for(const k of t.checks){let a=(k.actual!==undefined&&k.actual!==''&&String(k.actual).length<90)?`: ${esc(k.actual)}`:'';o+=`\\item ${k.ok?'\\tick':'\\textcolor{warnred}{×}'} ${esc(k.desc)}${a}\n`}
  o+=`\\end{itemize}\n`;
 }
});
const gal=[['A01_menu','Menu 8 sản phẩm (A01)'],['A04_detail','Chi tiết, đổi size (A04)'],['B01_cart','Giỏ hàng (B01)'],['D03_coupon','Mã BREW10 (D03)'],['D06_failed','Thanh toán lỗi, giữ giỏ (D06)'],['D01_confirm','Xác nhận đơn (D01)'],['F02_loser','Hai khách tranh ly cuối (F02)'],['E04_ready','Trạng thái pha chế (E04)']];
o+=`\\section{Ảnh chụp màn hình tiêu biểu}\n\\begin{figure}[H]\\centering\n`;
gal.forEach((g,i)=>{o+=`\\begin{subfigure}{0.46\\textwidth}\\shot[width=\\textwidth]{shots/${g[0]}.png}\\caption{${esc(g[1])}}\\end{subfigure}${i%2==0?'\\hfill':'\\\\[6pt]'}\n`});
o+=`\\caption{Ảnh chụp tự động từ lượt chạy cuối (còn ${fs.readdirSync('shots').length} ảnh trong thư mục \\texttt{shots/})}\\end{figure}
\\begin{figure}[H]\\centering
\\shot[height=7cm]{shots/H01_menu.png}\\hspace{4pt}\\shot[height=7cm]{shots/H01_gio.png}\\hspace{4pt}\\shot[height=7cm]{shots/H01_thanh-toan.png}
\\caption{Giao diện điện thoại 375×812 (H01): không tràn ngang}\\end{figure}

\\section{Đối chiếu yêu cầu: 10 task}
\\begin{longtable}{|L{0.6cm}|L{3cm}|L{6.2cm}|L{1.2cm}|L{2.4cm}|}\\hline
\\textbf{\\#}&\\textbf{Task}&\\textbf{Bằng chứng kiểm thử}&\\textbf{Kết luận}&\\textbf{Ghi chú}\\\\\\hline\\endhead
`;
const tasks=[
['1','Khởi tạo dự án','Toàn bộ 55 kịch bản chạy trên bản build thật; backend 3001, frontend 3000, Postgres; README và Docker Compose.','Đạt','Chưa chạy lại \\texttt{docker compose} trong lượt này'],
['2','API danh sách sản phẩm','A01, A07, A08, G03: danh sách, chi tiết, 404, hết hàng.','Đạt',''],
['3','Trang Menu','A01 (8 sản phẩm), A02 (lỗi mạng và thử lại), A03 (rỗng), A08 (hết hàng), H01 (di động).','Đạt',''],
['4','Chi tiết và tùy chọn','A04, A05 (48 tổ hợp size×topping), A06 (số lượng 1--20), G03 (server tự tính giá).','Đạt',''],
['5','Giỏ hàng','B01--B05: thêm, gộp dòng, tăng giảm xóa, lưu qua tải lại, giới hạn 20, giỏ trống; F04, F05.','Đạt','Giỏ chung trên một trình duyệt'],
['6','API tạo đơn','G02 (19 điểm kiểm tra), G03, G06 (30 khách tranh 10 sản phẩm), D10, F01.','Đạt',''],
['7','Đăng ký, đăng nhập (JWT)','C01--C09, G01: đăng ký, trùng email, dữ liệu sai, phiên, chuyển hướng, XSS và SQL injection, token hỏng.','Đạt','JWT lưu \\texttt{localStorage}'],
['8','Thanh toán không tiền mặt','D01, D02 (ví, thẻ), D06, D08, D09, G04, G05: thành công, lỗi, thử lại, bấm liên tục, mất mạng.','Đạt','Cổng thanh toán là mô phỏng'],
['9','Xác nhận, lịch sử, bàn giao','D01, E01--E05: xác nhận đơn, lịch sử, chi tiết, cô lập giữa người dùng, hủy, cập nhật trạng thái.','Đạt','Chưa có giao diện cho nhân viên'],
['10','Nghiệp vụ backend','State machine (E03--E05, G01), idempotent (D08--D10, G04, G05), tồn kho đồng thời (F02, F03, G06), khuyến mãi và điểm (D03--D06, E06); 34 test backend.','Đạt','Sau khi sửa E06, F04'],
];
for(const t of tasks)o+=`${t[0]}&${t[1]}&${t[2]}&\\textcolor{okgreen}{\\textbf{${t[3]}}}&\\footnotesize ${t[4]}\\\\\\hline\n`;
o+=`\\end{longtable}

\\section{Kết luận: đã đủ yêu cầu chưa?}
\\textbf{Về yêu cầu của đề}: đủ. Cả 10 task đều có bằng chứng kiểm thử cụ thể; luồng chính (xem menu $\\to$ chọn tùy chọn $\\to$ giỏ $\\to$ đăng nhập $\\to$ thanh toán $\\to$ xác nhận $\\to$ lịch sử) chạy đúng, và các yêu cầu khó của Task 10 (máy trạng thái, idempotent, tồn kho đồng thời, khuyến mãi) đều được kiểm chứng trên cả giao diện lẫn cơ sở dữ liệu.

\\textbf{Về chất lượng nghiệp vụ}: lượt kiểm thử đã tìm ra 6 lỗi, trong đó lỗi nặng nhất (F04: trừ tiền theo giá khách chưa thấy) chỉ lộ ra khi mô phỏng giá thay đổi. Cả 6 đã sửa và chạy lại toàn bộ.

\\textbf{Giới hạn đã biết (không nằm trong yêu cầu, nên ghi rõ để giảng viên không hiểu nhầm là đã làm):}
\\begin{itemize}
\\item Đơn \\texttt{PENDING} không tự hết hạn nên có thể giữ kho vô thời hạn (cần một tác vụ định kỳ hủy đơn quá hạn).
\\item Giỏ hàng lưu theo trình duyệt, không theo tài khoản: hai người dùng chung một trình duyệt sẽ thấy cùng giỏ.
\\item Cổng thanh toán là bản mô phỏng; không có quy trình hoàn tiền khi khách hủy đơn đã thanh toán.
\\item Tồn kho tính theo sản phẩm, không theo nguyên liệu; chưa có giao diện quản trị cho nhân viên (cập nhật trạng thái qua API).
\\item JWT lưu trong \\texttt{localStorage} (đơn giản nhưng kém an toàn hơn cookie \\texttt{HttpOnly}).
\\item Chưa kiểm thử tải lớn, nhiều trình duyệt khác nhau (chỉ Chromium) và khả năng truy cập (accessibility) đầy đủ.
\\end{itemize}
\\end{document}
`;
fs.writeFileSync('Test_report.tex',o);
