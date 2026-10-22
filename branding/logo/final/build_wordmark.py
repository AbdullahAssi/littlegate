"""Outline 'littlegate' in Fredoka SemiBold (wght 600, wdth 100) to SVG path data, with GPOS pair kerning."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.ttLib.removeOverlaps import removeOverlaps
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import json, sys

TEXT = "littlegate"
font = instantiateVariableFont(TTFont("../../fonts/Fredoka.ttf"), {"wght": 600, "wdth": 100})
removeOverlaps(font)  # merge overlapping contours (variable fonts keep them) so cut/embroidery has no seams
cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
upm = font["head"].unitsPerEm
names = [cmap[ord(c)] for c in TEXT]

def kern(a, b):
    total = 0
    if "GPOS" not in font: return 0
    for lk in font["GPOS"].table.LookupList.Lookup:
        if lk.LookupType not in (2, 9): continue
        for st in lk.SubTable:
            if lk.LookupType == 9: st = st.ExtSubTable
            if st.LookupType != 2 or a not in st.Coverage.glyphs: continue
            if st.Format == 1:
                ps = st.PairSet[st.Coverage.glyphs.index(a)]
                for pv in ps.PairValueRecord:
                    if pv.SecondGlyph == b and pv.Value1: total += getattr(pv.Value1, "XAdvance", 0) or 0
            else:
                c1 = st.ClassDef1.classDefs.get(a, 0); c2 = st.ClassDef2.classDefs.get(b, 0)
                v = st.Class1Record[c1].Class2Record[c2].Value1
                if v: total += getattr(v, "XAdvance", 0) or 0
    return total

# extra optical tracking per pair (font units); negative tightens. Set after looking at renders.
TRACK = int(sys.argv[1]) if len(sys.argv) > 1 else 6
pen = SVGPathPen(gs); x = 0; kerns = []
for i, n in enumerate(names):
    gs[n].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))   # flip y: SVG y-down, baseline at 0
    if i < len(names) - 1:
        k = kern(n, names[i + 1]); kerns.append((n, names[i + 1], k))
        x += hmtx[n][0] + k + TRACK
bp = BoundsPen(gs); x = 0
for i, n in enumerate(names):
    gs[n].draw(TransformPen(bp, (1, 0, 0, -1, x, 0)))
    if i < len(names) - 1: x += hmtx[n][0] + kern(n, names[i + 1]) + TRACK
xmin, ymin, xmax, ymax = bp.bounds
stem = None
bl = BoundsPen(gs); gs[cmap[ord("l")]].draw(bl); stem = bl.bounds[2] - bl.bounds[0]
xh = BoundsPen(gs); gs[cmap[ord("x")]].draw(xh)
json.dump({"d": pen.getCommands(), "bounds": [xmin, ymin, xmax, ymax], "upm": upm,
           "l_width": stem, "x_height": xh.bounds[3], "kerns": kerns, "track": TRACK},
          open("wordmark.json", "w"))
print("upm", upm, "bounds", [round(v) for v in bp.bounds], "l stem", stem, "x-height", xh.bounds[3])
print("kerns", [k for k in kerns if k[2]])
