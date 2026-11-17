#!/usr/bin/env python3
"""Convert the report's diagram sources (Graphviz .dot, Mermaid .mmd) to editable draw.io files.

Layout comes from Graphviz (`dot -Tjson`); sequence diagrams are laid out here.
usage: build_drawio.py <diagrams_dir> <out_dir>
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mx import Doc, html_label  # noqa: E402

FONT = 'DejaVu Sans'
BR = re.compile(r'<br\s*/?>|\\n')


def txt(s):
    s = s.strip()
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        s = s[1:-1]
    return BR.sub('\n', s)


def dq(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n') + '"'


# ----------------------------------------------------------------------------
# DOT json -> draw.io
# ----------------------------------------------------------------------------
def run_dot(src):
    out = subprocess.run(['dot', '-Tjson'], input=src, capture_output=True, text=True)
    if out.returncode:
        raise RuntimeError(out.stderr)
    return json.loads(out.stdout)


def fnum(s, d=0.0):
    try:
        return float(s)
    except Exception:
        return d


def label_of(o):
    lb = o.get('label', '\\N')
    if lb == '\\N':
        lb = o['name']
    return lb.replace('\\n', '\n').replace('\\l', '\n').replace('\\r', '\n')


def node_style(o, fill, stroke):
    shape = o.get('shape', 'ellipse')
    sty = o.get('style', '')
    base = f'whiteSpace=wrap;html=1;fontSize=12;fontFamily={FONT};fillColor={fill};strokeColor={stroke};'
    if 'dashed' in sty:
        base += 'dashed=1;'
    if shape in ('ellipse', 'circle', 'oval'):
        return 'ellipse;' + base
    if shape == 'diamond':
        return 'rhombus;' + base
    if shape == 'box3d':
        return 'shape=cube;size=10;darkOpacity=0.05;' + base
    if shape == 'tab':
        return 'shape=folder;tabWidth=48;tabHeight=12;tabPosition=left;' + base
    if shape == 'cds':
        return 'shape=partialRectangle;left=0;right=0;' + base
    if shape == 'cylinder':
        return 'shape=cylinder3;boundedLbl=1;size=10;' + base
    if shape == 'point':
        return 'ellipse;aspect=fixed;fillColor=#000000;strokeColor=#000000;'
    rounded = 'rounded=1;' if 'rounded' in sty else ''
    if o.get('dround'):
        rounded = 'rounded=1;arcSize=50;'
    return rounded + base


def arrow(kind, filled_default=True):
    if kind in ('none', None):
        return 'none', 0
    if kind == 'open':
        return 'open', 0
    if kind in ('odiamond',):
        return 'diamondThin', 0
    if kind in ('diamond',):
        return 'diamondThin', 1
    if kind in ('empty', 'onormal'):
        return 'block', 0
    return 'block', 1


def dot_to_doc(name, dot_json, mode=''):
    objs = dot_json['objects']
    bb = [float(v) for v in dot_json['bb'].split(',')]
    H = bb[3]
    nodes = [o for o in objs if 'pos' in o]
    fs = fnum(nodes[0].get('fontsize'), 14.0) if nodes else 14.0
    s = 12.0 / fs
    doc = Doc(name)
    ids = {}  # gvid -> cell id

    def X(x):
        return x * s

    def Y(y):
        return (H - y) * s

    # clusters first (big ones behind)
    clusters = [o for o in objs if o['name'].startswith('cluster') and 'bb' in o]
    clusters.sort(key=lambda o: -(fnum(o['bb'].split(',')[2]) - fnum(o['bb'].split(',')[0])))
    for o in clusters:
        x1, y1, x2, y2 = [float(v) for v in o['bb'].split(',')]
        sty = o.get('style', '')
        fill = o.get('fillcolor', 'none') if 'filled' in sty else 'none'
        stroke = o.get('color', '#666666')
        st = (f'rounded=1;arcSize=3;whiteSpace=wrap;html=1;verticalAlign=top;align=left;spacingLeft=10;fontSize=13;fontStyle=1;'
              f'fontFamily={FONT};fillColor={fill};strokeColor={stroke};' + ('dashed=1;' if 'dashed' in sty else ''))
        ids[o['_gvid']] = doc.vertex(X(x1), Y(y2), (x2 - x1) * s, (y2 - y1) * s, label_of(o) if o.get('label') else '', st)
    for o in nodes:
        px, py = [float(v) for v in o['pos'].split(',')]
        w = fnum(o.get('width'), 1) * 72 * s
        h = fnum(o.get('height'), .5) * 72 * s
        if not o.get('dkind') and o.get('shape') != 'point' and fnum(o.get('width'), 1) > 0.3:
            w, h = w * 1.06, h * 1.12
        if o.get('dkind') in ('class', 'entity'):
            head = o.get('dhead')
            hh = 40 if o.get('dstereo') else 26
            fill = o.get('fillcolor', '#f6ebdd')
            stroke = o.get('color', '#6f4a2b')
            lab = (f"«{o['dstereo']}»\n" if o.get('dstereo') else '') + head
            st = (f'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize={hh};horizontalStack=0;resizeParent=1;'
                  f'resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;html=1;fontSize=12;fontFamily={FONT};fillColor={fill};strokeColor={stroke};')
            cid = doc.vertex(X(px) - w / 2, Y(py) - h / 2, w, h, lab, st)
            body = o.get('dbody', '')
            doc.vertex(0, hh, w, h - hh, body.replace('\\n', '\n'),
                       f'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;whiteSpace=wrap;html=1;fontSize=12;fontFamily={FONT};',
                       parent=cid)
            ids[o['_gvid']] = cid
            continue
        fill = o.get('fillcolor', '#ffffff') if ('filled' in o.get('style', '') or o.get('shape') == 'point') else 'none'
        if 'fillcolor' in o and fill == 'none':
            fill = o['fillcolor']
        stroke = o.get('color', '#333333')
        lab = '' if o.get('shape') == 'point' else label_of(o)
        ids[o['_gvid']] = doc.vertex(X(px) - w / 2, Y(py) - h / 2, w, h, lab, node_style(o, fill, stroke))
    name_to_gvid = {o['name']: o['_gvid'] for o in objs}
    for e in dot_json.get('edges', []):
        if e.get('style') == 'invis':
            continue
        t, hd = e['tail'], e['head']
        cluster_edge = False
        if e.get('ltail') and e['ltail'] in name_to_gvid:
            t = name_to_gvid[e['ltail']]
            cluster_edge = True
        if e.get('lhead') and e['lhead'] in name_to_gvid:
            hd = name_to_gvid[e['lhead']]
            cluster_edge = True
        pts = []
        for op in e.get('_draw_', []):
            if op.get('op') == 'b':
                p = op['points']
                pts = [(X(a), Y(b)) for a, b in p[3:-1:3]]
                break
        if mode == 'usecase' and not cluster_edge:
            tp_ = objs[e['tail']]
            hp_ = objs[e['head']]
            if 'dashed' in e.get('style', '') and clusters:
                cx2 = float(clusters[0]['bb'].split(',')[2])
                ty_ = float(tp_['pos'].split(',')[1])
                hy_ = float(hp_['pos'].split(',')[1])
                pts = [(X(cx2 - 12), Y(ty_)), (X(cx2 - 12), Y(hy_))]
            else:
                pts = []
        direction = e.get('dir', 'forward')
        ah, af = arrow(e.get('arrowhead', 'normal') if direction in ('forward', 'both') else 'none')
        at, atf = arrow(e.get('arrowtail', 'normal') if direction in ('back', 'both') else 'none')
        if e.get('dend'):
            ah, af = e['dend'], 0
        if e.get('dstart'):
            at, atf = e['dstart'], 0
        col = e.get('color', '#6f4a2b')
        st = (f'html=1;fontSize=11;fontFamily={FONT};strokeColor={col};endArrow={ah};endFill={af};startArrow={at};startFill={atf};'
              + ('dashed=1;' if 'dashed' in e.get('style', '') else '') + ('curved=1;' if len(pts) > 1 else '')
              + 'labelBackgroundColor=#ffffff;')
        if e.get('dendfill'):
            st += f"endFill={e['dendfill']};"
        if e.get('dstartfill'):
            st += f"startFill={e['dstartfill']};"
        eid = doc.edge(ids[t], ids[hd], label_of(e) if e.get('label') else '', st, points=None if cluster_edge else pts)
        if e.get('dsl'):
            doc.edge_label(eid, e['dsl'], -0.85, (0, -10))
        if e.get('dtl'):
            doc.edge_label(eid, e['dtl'], 0.85, (0, -10))
    return doc


# ----------------------------------------------------------------------------
# Mermaid flowchart / state / class / er -> DOT text
# ----------------------------------------------------------------------------
NODE_PATS = [
    (re.compile(r'\(\["?(.*?)"?\]\)'), 'stadium'),
    (re.compile(r'\[\("?(.*?)"?\)\]'), 'cylinder'),
    (re.compile(r'\["(.*?)"\]'), 'box'),
    (re.compile(r'\[(.*?)\]'), 'box'),
    (re.compile(r'\{"?(.*?)"?\}'), 'diamond'),
    (re.compile(r'\("?(.*?)"?\)'), 'round'),
]
ARROW_PLAIN = re.compile(r'\s*(<-->|-->|-\.->|---|==>)(?:\|([^|]*)\|)?\s*')
ARROW_LABEL = re.compile(r'\s*(--|-\.)\s+(.*?)\s+(-->|\.->|---)\s*')
ID = re.compile(r'[A-Za-z0-9_]+')


def parse_flowchart(src):
    nodes, edges, clusters, styles, classes = {}, [], [], {}, {}
    stack = []
    direction = 'TB'
    lines = src.splitlines()
    m = re.match(r'flowchart\s+(\w+)', lines[0])
    if m:
        direction = m.group(1)
    for raw in lines[1:]:
        line = raw.strip()
        if not line:
            continue
        m = re.match(r'subgraph\s+(\w+)(?:\[(.*)\])?$', line)
        if m:
            c = dict(id=m.group(1), title=txt(m.group(2) or m.group(1)), nodes=[], dir=None)
            clusters.append(c)
            stack.append(c)
            continue
        if line.startswith('direction') and stack:
            stack[-1]['dir'] = line.split()[1]
            continue
        if line == 'end':
            stack.pop()
            continue
        m = re.match(r'classDef\s+(\w+)\s+(.*?);?$', line)
        if m:
            classes[m.group(1)] = dict(kv.split(':', 1) for kv in m.group(2).split(','))
            continue
        m = re.match(r'class\s+([\w,]+)\s+(\w+);?$', line)
        if m:
            for n in m.group(1).split(','):
                styles.setdefault(n, {}).update(classes.get(m.group(2), {}))
            continue
        m = re.match(r'style\s+(\w+)\s+(.*?);?$', line)
        if m:
            styles.setdefault(m.group(1), {}).update(dict(kv.split(':', 1) for kv in m.group(2).split(',')))
            continue

        pos = 0

        def read_node(pos):
            m = ID.match(line, pos)
            nid = m.group(0)
            pos = m.end()
            label, shape = None, None
            for pat, sh in NODE_PATS:
                mm = pat.match(line, pos)
                if mm:
                    label, shape = txt(mm.group(1)), sh
                    pos = mm.end()
                    break
            if nid not in nodes:
                nodes[nid] = dict(id=nid, label=nid, shape='box')
                if stack:
                    stack[-1]['nodes'].append(nid)
            if label is not None:
                nodes[nid]['label'] = label
                nodes[nid]['shape'] = shape
            return nid, pos

        prev, pos = read_node(0)
        while pos < len(line):
            m = ARROW_PLAIN.match(line, pos)
            if m:
                kind, label = m.group(1), m.group(2)
                pos = m.end()
            else:
                m = ARROW_LABEL.match(line, pos)
                if not m:
                    break
                kind, label = m.group(1) + m.group(3), m.group(2)
                pos = m.end()
            cur, pos = read_node(pos)
            edges.append(dict(src=prev, dst=cur, label=txt(label) if label else '', dashed='.' in kind,
                              both=kind.startswith('<'), none=kind == '---'))
            prev = cur
    return dict(direction=direction, nodes=nodes, edges=edges, clusters=clusters, styles=styles)


def flow_to_dot(g):
    dirmap = {'TD': 'TB', 'TB': 'TB', 'LR': 'LR', 'RL': 'RL', 'BT': 'BT'}
    cl_ids = {c['id'] for c in g['clusters']}
    out = [f'digraph G {{ rankdir={dirmap[g["direction"]]}; compound=true; nodesep=0.35; ranksep=0.5; '
           f'graph [fontname="{FONT}" fontsize=12]; node [fontname="{FONT}" fontsize=12 margin="0.22,0.12"]; edge [fontname="{FONT}" fontsize=11];']
    in_cluster = {n for c in g['clusters'] for n in c['nodes']}

    def node_line(n):
        st = g['styles'].get(n['id'], {})
        sh = {'box': 'box', 'stadium': 'box', 'round': 'box', 'diamond': 'diamond', 'cylinder': 'cylinder'}[n['shape']]
        a = [f'label={dq(n["label"])}', f'shape={sh}', 'style="filled,rounded"' if n['shape'] in ('stadium', 'round') else 'style=filled']
        a.append(f'fillcolor={dq(st.get("fill", "#f6ebdd"))}')
        a.append(f'color={dq(st.get("stroke", "#6f4a2b"))}')
        if n['shape'] == 'stadium':
            a.append('dround=1')
        if n['shape'] == 'cylinder':
            a.append('peripheries=1')
        return f'{n["id"]} [{" ".join(a)}];'

    for c in g['clusters']:
        st = g['styles'].get(c['id'], {})
        out.append(f'subgraph cluster_{c["id"]} {{ label={dq(c["title"])}; style="rounded,filled"; fillcolor={dq(st.get("fill", "#faf6ef"))}; color={dq(st.get("stroke", "#6f4a2b"))}; labeljust=l;')
        for n in c['nodes']:
            out.append(node_line(g['nodes'][n]))
        if c['dir'] == 'LR' and g['direction'] != 'LR':
            out.append('{rank=same; ' + '; '.join(c['nodes']) + '}')
        out.append('}')
    for n in g['nodes'].values():
        if n['id'] not in in_cluster and n['id'] not in cl_ids:
            out.append(node_line(n))
    first = {c['id']: c['nodes'][0] for c in g['clusters']}
    for e in g['edges']:
        a = []
        s, d = e['src'], e['dst']
        if s in cl_ids:
            a.append(f'ltail=cluster_{s}')
            s = first[s]
        if d in cl_ids:
            a.append(f'lhead=cluster_{d}')
            d = first[d]
        if e['label']:
            a.append(f'label={dq(e["label"])}')
        if e['dashed']:
            a.append('style=dashed')
        if e['both']:
            a.append('dir=both')
        if e['none']:
            a.append('arrowhead=none')
        a.append('color="#6f4a2b"')
        out.append(f'{s} -> {d} [{" ".join(a)}];')
    out.append('}')
    return '\n'.join(out)


def state_to_dot(src):
    lines = src.splitlines()[1:]
    descr, trans = {}, []
    for raw in lines:
        l = raw.strip()
        if not l:
            continue
        m = re.match(r'^(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)(?:\s*:\s*(.*))?$', l)
        if m:
            trans.append((m.group(1), m.group(2), txt(m.group(3) or '')))
            continue
        m = re.match(r'^(\w+)\s*:\s*(.*)$', l)
        if m:
            descr[m.group(1)] = txt(m.group(2))
    states = []
    for a, b, _ in trans:
        for x in (a, b):
            if x != '[*]' and x not in states:
                states.append(x)
    out = [f'digraph S {{ rankdir=TB; nodesep=0.45; ranksep=0.55; graph [fontname="{FONT}" fontsize=12]; node [fontname="{FONT}" fontsize=12 margin="0.2,0.1"]; edge [fontname="{FONT}" fontsize=11 color="#6f4a2b"];',
           '__start [shape=point label="" width=0.2 height=0.2]; __end [label="" shape=circle style=filled fillcolor="#000000" width=0.22 height=0.22 peripheries=2 color="#000000"];']
    for s in states:
        lab = descr.get(s, s)
        out.append(f'{s} [label={dq(lab)} shape=box style="rounded,filled" fillcolor="#f6ebdd" color="#6f4a2b"];')
    for a, b, l in trans:
        a = '__start' if a == '[*]' else a
        b = '__end' if b == '[*]' else b
        out.append(f'{a} -> {b} [label={dq(l)}];' if l else f'{a} -> {b};')
    out.append('}')
    return '\n'.join(out)


REL = re.compile(r'^(\w+)\s+(?:"([^"]*)"\s+)?(<\|--|\*--|o--|-->|\.\.>|\.\.\|>|--)\s+(?:"([^"]*)"\s+)?(\w+)(?:\s*:\s*(.*))?$')


def class_to_dot(src):
    lines = src.splitlines()[1:]
    classes, rels, cur = {}, [], None
    direction = 'TB'
    for raw in lines:
        l = raw.strip()
        if not l:
            continue
        if l.startswith('direction'):
            direction = l.split()[1]
            continue
        m = re.match(r'^class\s+(\w+)\s*\{$', l)
        if m:
            cur = classes.setdefault(m.group(1), dict(stereo=None, members=[]))
            continue
        if l == '}':
            cur = None
            continue
        m = re.match(r'^class\s+(\w+)$', l)
        if m:
            classes.setdefault(m.group(1), dict(stereo=None, members=[]))
            continue
        if cur is not None:
            m = re.match(r'^<<(.*)>>$', l)
            if m:
                cur['stereo'] = m.group(1)
            else:
                cur['members'].append(l)
            continue
        m = REL.match(l)
        if m:
            rels.append(m.groups())
    out = [f'digraph C {{ rankdir={direction}; nodesep=0.5; ranksep=0.8; graph [fontname="{FONT}" fontsize=12]; node [fontname="{FONT}" fontsize=12 shape=box]; edge [fontname="{FONT}" fontsize=11 color="#6f4a2b"];']
    for n, c in classes.items():
        lines_ = [n] + c['members'] + (['«x»'] if c['stereo'] else [])
        w = max(len(x) for x in lines_) * 7.4 + 28
        hh = (40 if c['stereo'] else 26) + max(len(c['members']), 1) * 16 + 6
        out.append(f'{n} [width={w / 72:.3f} height={hh / 72:.3f} fixedsize=true dkind=class dhead={dq(n)} '
                   f'{"dstereo=" + dq(c["stereo"]) if c["stereo"] else ""} dbody={dq(chr(10).join(c["members"]))} '
                   f'fillcolor={dq("#e8f0e4" if c["stereo"] else "#f6ebdd")} color="#6f4a2b" style=filled];')
    for a, ca, kind, cb, b, lab in rels:
        at = []
        if lab:
            at.append(f'label={dq(lab)}')
        if ca:
            at.append(f'dsl={dq(ca)}')
        if cb:
            at.append(f'dtl={dq(cb)}')
        if kind == '*--':
            at += ['dir=both', 'arrowtail=diamond', 'arrowhead=none']
        elif kind == '-->':
            at += ['arrowhead=open']
        elif kind == '..>':
            at += ['arrowhead=open', 'style=dashed']
        elif kind == '..|>':
            at += ['arrowhead=empty', 'style=dashed']
        elif kind == '<|--':
            at += ['dir=back', 'arrowtail=empty', 'arrowhead=none']
        elif kind == 'o--':
            at += ['dir=back', 'arrowtail=odiamond', 'arrowhead=none']
        else:
            at += ['arrowhead=none']
        out.append(f'{a} -> {b} [{" ".join(at)}];')
    out.append('}')
    return '\n'.join(out)


ER_L = {'||': 'ERmandOne', '|o': 'ERzeroToOne', '}o': 'ERzeroToMany', '}|': 'ERoneToMany'}
ER_R = {'||': 'ERmandOne', 'o|': 'ERzeroToOne', 'o{': 'ERzeroToMany', '|{': 'ERoneToMany'}


def er_to_dot(src):
    ents, rels, cur = {}, [], None
    for raw in src.splitlines()[1:]:
        l = raw.strip()
        if not l:
            continue
        m = re.match(r'^(\w+)\s*\{$', l)
        if m:
            cur = ents.setdefault(m.group(1), [])
            continue
        if l == '}':
            cur = None
            continue
        if cur is not None:
            m = re.match(r'^(\S+)\s+(\S+)(?:\s+(PK|UK|FK))?(?:\s+"(.*)")?$', l)
            t, n, k, c = m.groups()
            cur.append(f'{k + " " if k else ""}{n} : {t}' + (f'  ({c})' if c else ''))
            continue
        m = re.match(r'^(\w+)\s+(\S\S)(--|\.\.)(\S\S)\s+(\w+)\s*:\s*"?(.*?)"?$', l)
        if m:
            rels.append(m.groups())
    out = [f'digraph E {{ rankdir=TB; nodesep=0.7; ranksep=1.0; graph [fontname="{FONT}" fontsize=12]; node [fontname="{FONT}" fontsize=12 shape=box]; edge [fontname="{FONT}" fontsize=11 color="#6f4a2b"];']
    for n, rows in ents.items():
        w = max([len(n)] + [len(r) for r in rows]) * 7.4 + 28
        hh = 26 + len(rows) * 16 + 6
        out.append(f'{n} [width={w / 72:.3f} height={hh / 72:.3f} fixedsize=true dkind=entity dhead={dq(n)} dbody={dq(chr(10).join(rows))} fillcolor="#e3ecf6" color="#4a6fa5" style=filled];')
    for a, l, mid, r, b, lab in rels:
        out.append(f'{a} -> {b} [label={dq(lab)} dstart={ER_L[l]} dend={ER_R[r]} arrowhead=none arrowtail=none dir=both'
                   f'{" style=dashed" if mid == ".." else ""}];')
    out.append('}')
    return '\n'.join(out)


# ----------------------------------------------------------------------------
# Sequence diagrams
# ----------------------------------------------------------------------------
def parse_rgb(s):
    m = re.match(r'rgb\((\d+),\s*(\d+),\s*(\d+)\)', s)
    return '#%02x%02x%02x' % tuple(int(v) for v in m.groups()) if m else '#f6ebdd'


def seq_to_doc(name, src):
    lines = [l.strip() for l in src.splitlines()[1:] if l.strip()]
    parts = []  # (id, label, actor)
    auto = False
    ev = []  # events
    for l in lines:
        if l == 'autonumber':
            auto = True
            continue
        m = re.match(r'(participant|actor)\s+(\w+)(?:\s+as\s+(.*))?$', l)
        if m:
            parts.append((m.group(2), txt(m.group(3) or m.group(2)), m.group(1) == 'actor'))
            continue
        m = re.match(r'Note\s+(over|right of|left of)\s+([\w,]+):\s*(.*)$', l)
        if m:
            ev.append(('note', m.group(1), m.group(2).split(','), txt(m.group(3))))
            continue
        m = re.match(r'rect\s+(.*)$', l)
        if m:
            ev.append(('rect', parse_rgb(m.group(1))))
            continue
        m = re.match(r'(alt|opt|loop)\s*(.*)$', l)
        if m:
            ev.append(('alt', m.group(1), txt(m.group(2))))
            continue
        m = re.match(r'else\s*(.*)$', l)
        if m:
            ev.append(('else', txt(m.group(1))))
            continue
        if l == 'end':
            ev.append(('end',))
            continue
        m = re.match(r'(\w+)\s*(-->>|->>|--x|-x|--\)|-\))\s*(\w+)\s*:\s*(.*)$', l)
        if m:
            ev.append(('msg', m.group(1), m.group(3), m.group(2).startswith('--'), txt(m.group(4))))
            continue
    idx = {p[0]: i for i, p in enumerate(parts)}
    GAP = 175
    X0 = 130
    cx = [X0 + i * GAP for i in range(len(parts))]
    doc = Doc(name)
    top = 20
    HEAD = 46

    # first pass: compute y positions and frame extents
    y = top + HEAD + 24
    placed = []
    stack = []
    n = 0
    for e in ev:
        k = e[0]
        if k == 'msg':
            if auto:
                n += 1
            lab = (f'{n}. ' if auto else '') + e[4]
            nl = lab.count('\n') + 1
            self_msg = e[1] == e[2]
            placed.append(('msg', e, y, lab))
            y += (44 if self_msg else 30) + 14 * (nl - 1) + 8
        elif k == 'note':
            nl = e[3].count('\n') + 1
            h = 24 + 14 * (nl - 1) if len(e[3]) < 60 else 38
            placed.append(('note', e, y, h))
            y += h + 14
        elif k in ('rect', 'alt'):
            stack.append((k, e, y, len(stack)))
            y += 8 if k == 'rect' else 26
        elif k == 'else':
            placed.append(('else', e, y, None))
            y += 22
        elif k == 'end':
            kind, ev0, y0, depth = stack.pop()
            placed.append((kind + '_close', ev0, y0, (y + 4, depth)))
            y += 10
    bottom = y + 10
    # draw: rects first (behind), then lifelines, frames, messages
    left = cx[0] - 110
    right = cx[-1] + 110
    for p in placed:
        if p[0] == 'rect_close':
            _, e0, y0, (y1, depth) = p
            doc.vertex(left + depth * 6, y0, right - left - depth * 12, y1 - y0, '',
                       f'rounded=0;fillColor={e0[1]};strokeColor=none;opacity=60;')
    ids = {}
    for i, (pid, lab, actor) in enumerate(parts):
        if actor:
            ids[pid] = doc.vertex(cx[i] - 15, top - 4, 30, HEAD, lab,
                                  f'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontSize=12;fontFamily={FONT};fillColor=#f6ebdd;strokeColor=#6f4a2b;')
        else:
            ids[pid] = doc.vertex(cx[i] - 60, top, 120, HEAD, lab,
                                  f'rounded=0;whiteSpace=wrap;html=1;fontSize=12;fontFamily={FONT};fillColor=#f6ebdd;strokeColor=#6f4a2b;')
        base = top + (HEAD + 22 if actor else HEAD)
        doc.edge(ids[pid], None, '', 'endArrow=none;dashed=1;html=1;strokeColor=#888888;', sp=(cx[i], base), tp=(cx[i], bottom))
    for p in placed:
        if p[0] == 'alt_close':
            _, e0, y0, (y1, depth) = p
            ins = depth * 8
            doc.vertex(left + 10 + ins, y0, right - left - 20 - 2 * ins, y1 - y0, e0[1],
                       f'shape=umlFrame;whiteSpace=wrap;html=1;width=44;height=20;fontSize=11;fontFamily={FONT};fillColor=none;strokeColor=#5b7f4f;swimlaneFillColor=none;')
            if e0[2]:
                doc.vertex(left + 60 + ins, y0 + 2, right - left - 80 - 2 * ins, 18, '[' + e0[2] + ']',
                           f'text;html=1;align=left;verticalAlign=middle;fontSize=11;fontFamily={FONT};fontStyle=2;')
        elif p[0] == 'else':
            _, e0, yy, _ = p
            doc.edge(None, None, '', 'endArrow=none;dashed=1;html=1;strokeColor=#5b7f4f;', sp=(left + 10, yy + 4), tp=(right - 10, yy + 4))
            doc.vertex(left + 16, yy + 5, right - left - 40, 16, '[' + e0[1] + ']',
                       f'text;html=1;align=left;verticalAlign=middle;fontSize=11;fontFamily={FONT};fontStyle=2;')
    for p in placed:
        if p[0] == 'note':
            _, e0, yy, h = p
            xs = [cx[idx[v]] for v in e0[2]]
            if e0[1] == 'over':
                x1, x2 = min(xs) - 90, max(xs) + 90
                if len(xs) == 1:
                    x1, x2 = xs[0] - 110, xs[0] + 110
            elif e0[1] == 'right of':
                x1, x2 = xs[0] + 10, xs[0] + 190
            else:
                x1, x2 = xs[0] - 190, xs[0] - 10
            doc.vertex(x1, yy, x2 - x1, h, e0[3],
                       f'shape=note;size=8;whiteSpace=wrap;html=1;fontSize=11;fontFamily={FONT};fillColor=#fff7d6;strokeColor=#b59b3a;')
        elif p[0] == 'msg':
            _, e0, yy, lab = p
            a, b = cx[idx[e0[1]]], cx[idx[e0[2]]]
            dashed = 'dashed=1;' if e0[3] else ''
            end = 'open' if e0[3] else 'block'
            st = f'html=1;fontSize=11;fontFamily={FONT};endArrow={end};endFill={0 if e0[3] else 1};{dashed}strokeColor=#3b2a1c;verticalAlign=bottom;labelBackgroundColor=none;'
            nl = lab.count('\n')
            if e0[1] == e0[2]:
                eid = doc.edge(None, None, lab, st + 'align=left;', sp=(a, yy + 6), tp=(a, yy + 28),
                               points=[(a + 55, yy + 6), (a + 55, yy + 28)])
            else:
                doc.edge(None, None, lab, st, sp=(a, yy + 14 * nl + 18), tp=(b, yy + 14 * nl + 18))
    return doc


# ----------------------------------------------------------------------------
def convert(ddir, odir):
    odir.mkdir(parents=True, exist_ok=True)
    made = []
    for f in sorted(ddir.glob('*.dot')):
        doc = dot_to_doc(f.stem, run_dot(f.read_text()), 'usecase' if f.stem == 'usecase' else '')
        made.append((f.stem, doc))
    for f in sorted(ddir.glob('*.mmd')):
        src = f.read_text()
        head = src.lstrip().splitlines()[0].strip()
        if head.startswith('flowchart'):
            dot = flow_to_dot(parse_flowchart(src))
        elif head.startswith('stateDiagram'):
            dot = state_to_dot(src)
        elif head.startswith('classDiagram'):
            dot = class_to_dot(src)
        elif head.startswith('erDiagram'):
            dot = er_to_dot(src)
        elif head.startswith('sequenceDiagram'):
            made.append((f.stem, seq_to_doc(f.stem, src)))
            continue
        else:
            print('skip', f)
            continue
        (odir / (f.stem + '.dot.tmp')).write_text(dot)
        made.append((f.stem, dot_to_doc(f.stem, run_dot(dot))))
    for name, doc in made:
        (odir / f'{name}.drawio').write_text(doc.xml(), encoding='utf-8')
        print('ok', name, len(doc.cells), 'cells')
    for t in odir.glob('*.tmp'):
        t.unlink()


if __name__ == '__main__':
    convert(Path(sys.argv[1]), Path(sys.argv[2]))
