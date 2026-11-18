"""Tiny mxGraph (draw.io) writer used by build_drawio.py."""
from xml.sax.saxutils import escape


def html_label(text):
    """plain text with \n -> HTML label (html=1), already XML-attribute safe."""
    t = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    t = t.replace('\n', '<br>')
    return escape(t, {'"': '&quot;'})


def style(**kw):
    return ';'.join(f'{k}={v}' for k, v in kw.items() if v not in (None, '')) + ';'


class Doc:
    def __init__(self, name):
        self.name = name
        self.cells = []
        self.n = 1
        self.w = 0
        self.h = 0

    def nid(self):
        self.n += 1
        return f'c{self.n}'

    def vertex(self, x, y, w, h, label='', st='', parent='1', raw_label=False, cid=None):
        cid = cid or self.nid()
        val = label if raw_label else html_label(label)
        self.cells.append(
            f'<mxCell id="{cid}" value="{val}" style="{st}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" as="geometry"/></mxCell>')
        self.w = max(self.w, x + w)
        self.h = max(self.h, y + h)
        return cid

    def edge(self, src, dst, label='', st='', points=None, sp=None, tp=None, parent='1', cid=None):
        cid = cid or self.nid()
        a = ''
        if src:
            a += f' source="{src}"'
        if dst:
            a += f' target="{dst}"'
        g = '<mxGeometry relative="1" as="geometry">'
        if sp:
            g += f'<mxPoint x="{sp[0]:.1f}" y="{sp[1]:.1f}" as="sourcePoint"/>'
        if tp:
            g += f'<mxPoint x="{tp[0]:.1f}" y="{tp[1]:.1f}" as="targetPoint"/>'
        if points:
            g += '<Array as="points">' + ''.join(f'<mxPoint x="{x:.1f}" y="{y:.1f}"/>' for x, y in points) + '</Array>'
        g += '</mxGeometry>'
        self.cells.append(f'<mxCell id="{cid}" value="{html_label(label)}" style="{st}" edge="1" parent="{parent}"{a}>{g}</mxCell>')
        for p in (points or []) + ([sp] if sp else []) + ([tp] if tp else []):
            self.w = max(self.w, p[0])
            self.h = max(self.h, p[1])
        return cid

    def edge_label(self, edge_id, text, pos, off=(0, 0)):
        """child label placed at relative position pos along edge (-1 start .. 1 end)."""
        cid = self.nid()
        self.cells.append(
            f'<mxCell id="{cid}" value="{html_label(text)}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=11;labelBackgroundColor=none;" '
            f'vertex="1" connectable="0" parent="{edge_id}"><mxGeometry x="{pos}" y="0" relative="1" as="geometry">'
            f'<mxPoint x="{off[0]}" y="{off[1]}" as="offset"/></mxGeometry></mxCell>')

    def xml(self):
        W = int(self.w + 60)
        H = int(self.h + 60)
        return ('<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net">'
                f'<diagram id="{escape(self.name)}" name="{escape(self.name)}">'
                f'<mxGraphModel dx="{W}" dy="{H}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{W}" pageHeight="{H}" math="0" shadow="0">'
                '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' + ''.join(self.cells) + '</root></mxGraphModel></diagram></mxfile>')
