#!/usr/bin/env python3
"""Rough SVG preview of a .drawio file (only to sanity-check the generated layout)."""
import re, sys, html
import xml.etree.ElementTree as ET
def val(c):
    v=c.get('value') or ''
    v=re.sub(r'<br\s*/?>','\n',html.unescape(v)); return html.unescape(re.sub(r'<[^>]+>','',v))
def sty(s):
    d={}
    for p in (s or '').split(';'):
        if '=' in p: k,v=p.split('=',1); d[k]=v
        elif p: d[p]='1'
    return d
def render(path,out):
    root=ET.parse(path).getroot().find('.//root')
    cells={c.get('id'):c for c in root}
    geo={}
    def absgeo(c):
        g=c.find('mxGeometry'); x,y,w,h=[float(g.get(k,0)) for k in('x','y','width','height')]
        p=c.get('parent')
        if p in cells and p not in('0','1') and cells[p].get('vertex'):
            px,py,_,_=absgeo(cells[p]); x+=px;y+=py
        return x,y,w,h
    body=[];W=H=0
    for c in root:
        if c.get('vertex')=='1' and c.find('mxGeometry') is not None and not c.get('connectable')=='0':
            geo[c.get('id')]=absgeo(c)
    for cid,(x,y,w,h) in geo.items():
        c=cells[cid]; s=sty(c.get('style')); W=max(W,x+w);H=max(H,y+h)
        fill=s.get('fillColor','none'); st=s.get('strokeColor','#000')
        if fill=='none' and 'text' in s: st='none'
        da=' stroke-dasharray="6 4"' if s.get('dashed') else ''
        sh=s.get('shape','')
        if 'ellipse' in s or sh.startswith('ellipse'): body.append(f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w/2}" ry="{h/2}" fill="{fill}" stroke="{st}"{da}/>')
        elif 'rhombus' in s: body.append(f'<polygon points="{x+w/2},{y} {x+w},{y+h/2} {x+w/2},{y+h} {x},{y+h/2}" fill="{fill}" stroke="{st}"/>')
        elif sh=='umlActor': body.append(f'<circle cx="{x+w/2}" cy="{y+8}" r="7" fill="none" stroke="{st}"/><path d="M{x+w/2},{y+15}v14M{x},{y+20}h{w}M{x+w/2},{y+29}l-8,14M{x+w/2},{y+29}l8,14" stroke="{st}" fill="none"/>')
        else:
            rx=8 if s.get('rounded')=='1' else 0
            body.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{st}"{da}/>')
        t=val(c)
        if t:
            lines=t.split('\n'); fs=11
            if 'swimlane' in s:
                hh=float(s.get('startSize',26)); ty=y+hh/2-(len(lines)-1)*fs/2+4; cxx=x+w/2; al='middle'
            elif s.get('verticalAlign')=='top' and s.get('align')=='left': ty=y+14; cxx=x+8; al='start'
            elif s.get('align')=='left': ty=y+14; cxx=x+6; al='start'
            elif sh=='umlActor': ty=y+h+12; cxx=x+w/2; al='middle'; 
            else: ty=y+h/2-(len(lines)-1)*fs/2+4; cxx=x+w/2; al='middle'
            for i,l in enumerate(lines): body.append(f'<text x="{cxx}" y="{ty+i*fs*1.25}" font-size="{fs}" text-anchor="{al}" font-family="DejaVu Sans">{html.escape(l)}</text>')
    def ctr(i):
        x,y,w,h=geo[i]; return x+w/2,y+h/2
    def clip(i,p):
        x,y,w,h=geo[i]; cx,cy=x+w/2,y+h/2; dx,dy=p[0]-cx,p[1]-cy
        if dx==0 and dy==0: return cx,cy
        t=min((w/2)/abs(dx) if dx else 1e9,(h/2)/abs(dy) if dy else 1e9); return cx+dx*t,cy+dy*t
    for c in root:
        if c.get('edge')!='1': continue
        g=c.find('mxGeometry'); s=sty(c.get('style'))
        pts=[(float(p.get('x')),float(p.get('y'))) for p in g.findall('./Array/mxPoint')]
        sp=g.find("mxPoint[@as='sourcePoint']"); tp=g.find("mxPoint[@as='targetPoint']")
        a=c.get('source'); b=c.get('target')
        A=(float(sp.get('x')),float(sp.get('y'))) if sp is not None else None
        B=(float(tp.get('x')),float(tp.get('y'))) if tp is not None else None
        if a in geo and A is None: A=clip(a,pts[0] if pts else (ctr(b) if b in geo else (0,0)))
        if b in geo and B is None: B=clip(b,pts[-1] if pts else (ctr(a) if a in geo else (0,0)))
        if A is None or B is None: continue
        P=[A]+pts+[B]
        da=' stroke-dasharray="5 4"' if s.get('dashed') else ''
        body.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in P)+f'" fill="none" stroke="{s.get("strokeColor","#444")}"{da}/>')
        if s.get('endArrow','classic') not in('none',):
            (x1,y1),(x2,y2)=P[-2],P[-1]; import math; ang=math.atan2(y2-y1,x2-x1)
            body.append(f'<polygon points="{x2},{y2} {x2-9*math.cos(ang-.4)},{y2-9*math.sin(ang-.4)} {x2-9*math.cos(ang+.4)},{y2-9*math.sin(ang+.4)}" fill="{s.get("strokeColor","#444")}"/>')
        t=val(c)
        if t:
            m=P[len(P)//2] if len(P)%2 else ((P[len(P)//2-1][0]+P[len(P)//2][0])/2,(P[len(P)//2-1][1]+P[len(P)//2][1])/2)
            for i,l in enumerate(t.split('\n')): body.append(f'<text x="{m[0]}" y="{m[1]-4+i*12-(t.count(chr(10)))*12}" font-size="10" text-anchor="middle" font-family="DejaVu Sans" fill="#222" stroke="#fff" stroke-width="3" paint-order="stroke">{html.escape(l)}</text>')
        for p in P: W=max(W,p[0]);H=max(H,p[1])
    open(out,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W+30}" height="{H+30}" viewBox="-10 -10 {W+30} {H+30}"><rect x="-10" y="-10" width="100%" height="100%" fill="#fff"/>'+''.join(body)+'</svg>')
if __name__=='__main__': render(sys.argv[1],sys.argv[2])
