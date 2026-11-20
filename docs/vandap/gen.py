# -*- coding: utf-8 -*-
import re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from qa import CH, EX

SYM = {'→': r'$\rightarrow$', '←': r'$\leftarrow$', '↔': r'$\leftrightarrow$', '⌊': r'$\lfloor$', '⌋': r'$\rfloor$', '≥': r'$\ge$', '≤': r'$\le$',
       '×': r'$\times$', '−': r'$-$', '✓': r'\checkmark{}', '⋮': r'$\vdots$', '…': r'\ldots{}', '●': r'$\bullet$'}

def esc(s):
    out = []
    parts = re.split(r'(`[^`]*`)', s)
    for p in parts:
        code = p.startswith('`') and p.endswith('`') and len(p) > 1
        if code: p = p[1:-1]
        t = p.replace('\\', r'\textbackslash{}')
        for a, b in [('&', r'\&'), ('%', r'\%'), ('$', r'\$'), ('#', r'\#'), ('_', r'\_'), ('{', r'\{'), ('}', r'\}'),
                     ('~', r'\textasciitilde{}'), ('^', r'\textasciicircum{}')]:
            t = t.replace(a, b)
        t = t.replace(r'\textbackslash\{\}', r'\textbackslash{}')
        for a, b in SYM.items(): t = t.replace(a, b)
        t = t.replace('<', r'\textless{}').replace('>', r'\textgreater{}')
        out.append(r'\texttt{' + t + '}' if code else t)
    return ''.join(out)

LV = {1: r'\lvA', 2: r'\lvB', 3: r'\lvC'}
L = []
w = L.append
w(open(os.path.join(os.path.dirname(__file__), 'preamble.tex'), encoding='utf-8').read())

# ---------- Phần I ----------
w(r'\part{Câu hỏi vấn đáp và gợi ý trả lời}')
n = 0
for ci, (title, intro, imgs, qs) in enumerate(CH, 1):
    w(r'\section{' + esc(title) + '}')
    w(r'\noindent\textit{' + esc(intro) + r'} \hfill \small(' + str(len(qs)) + r' câu)\normalsize\par\medskip')
    if imgs:
        k = len(imgs)
        wd = {1: 0.62, 2: 0.47, 3: 0.31}[k]
        w(r'\begin{center}')
        for im in imgs:
            w(r'\fbox{\includegraphics[width=%.2f\textwidth,height=0.30\textheight,keepaspectratio]{img/%s}}\hspace{2mm}' % (wd, im))
        w(r'\end{center}\vspace{-2mm}')
    for q, a, lv in qs:
        n += 1
        w(r'\qa{%d}{%s}{%s}{%s}' % (n, LV[lv], esc(q), esc(a)))
TOTALQ = n

# ---------- Phần II ----------
w(r'\clearpage\part{Bài tập thực hành}\setcounter{section}{0}')
w(r'\noindent Làm trực tiếp vào chỗ trống (in ra hoặc ghi chú trên PDF). Đáp án ở Phần III, chỉ xem sau khi đã làm xong.\par\medskip')
SM = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'PAYMENT\\_FAILED', 'CANCELLED']
keys = []
for ei, (title, intro, items) in enumerate(EX, 1):
    w(r'\section{' + esc(title) + '}')
    if intro: w(r'\noindent\textit{' + esc(intro) + r'}\par\medskip')
    for ii, (q, space, ans) in enumerate(items, 1):
        lab = '%d.%d' % (ei, ii)
        keys.append((lab, title, ans))
        w(r'\exq{' + lab + '}{' + esc(q) + '}')
        if isinstance(space, int):
            w(r'\writelines{%d}' % space)
        elif space.startswith('grid:'):
            w(r'\drawgrid{%s}' % space.split(':')[1])
        elif space == 'table:sm':
            hdr = ' & '.join(r'\rotatebox{90}{\scriptsize %s}' % s for s in SM)
            w(r'\begin{center}\renewcommand{\arraystretch}{1.6}\begin{tabular}{|l|' + 'c|' * 7 + r'}\hline')
            w(r'\diagbox[width=2.9cm]{\scriptsize Từ}{\scriptsize Tới} & ' + hdr + r' \\ \hline')
            for s in SM: w(r'\scriptsize ' + s + ' & ' + ' & '.join([r'\hspace{6mm}'] * 7) + r' \\ \hline')
            w(r'\end{tabular}\end{center}')

# ---------- Phần III ----------
w(r'\clearpage\part{Đáp án bài tập}')
cur = None
for lab, title, ans in keys:
    if title != cur:
        w(r'\subsection*{' + esc(title) + '}')
        cur = title
    w(r'\ansq{' + lab + '}{' + esc(ans) + '}')
    if lab == '2.1':
        hdr = ' & '.join(r'\rotatebox{90}{\scriptsize %s}' % s for s in SM)
        ok = {'PENDING': ['PAID', 'PAYMENT\\_FAILED', 'CANCELLED'], 'PAYMENT\\_FAILED': ['PENDING', 'CANCELLED'], 'PAID': ['PREPARING', 'CANCELLED'], 'PREPARING': ['READY'], 'READY': ['COMPLETED']}
        w(r'\begin{center}\renewcommand{\arraystretch}{1.3}\begin{tabular}{|l|' + 'c|' * 7 + r'}\hline')
        w(r'\diagbox[width=2.9cm]{\scriptsize Từ}{\scriptsize Tới} & ' + hdr + r' \\ \hline')
        for s in SM:
            w(r'\scriptsize ' + s + ' & ' + ' & '.join(r'\textcolor{good}{\checkmark}' if t in ok.get(s, []) else '' for t in SM) + r' \\ \hline')
        w(r'\end{tabular}\end{center}')

w(r'\end{document}')
src = '\n'.join(L).replace('@@TOTALQ@@', str(TOTALQ)).replace('@@TOTALEX@@', str(len(keys)))
open(os.path.join(os.path.dirname(__file__), 'BrewLite_Van_dap.tex'), 'w', encoding='utf-8').write(src)
print('questions', TOTALQ, 'exercises', len(keys))
