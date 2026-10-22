"""Build Littlegate master SVGs: symbol (regular / small-size / reversed), wordmark, horizontal + stacked lockups."""
import json

IRIS, INK, IRIS_DARK, PAPER_DARK, WHITE = "#4E3FD6", "#221F2B", "#A99CFF", "#F1F0F6", "#FFFFFF"

def arch(cy, r_out, stroke, dot_r, dot_cy, leg_bottom):
    """Open arch on x-centre 128 with round-capped legs, plus the dot (the child)."""
    r_in = r_out - stroke; cap = stroke / 2
    xo1, xo2, xi1, xi2 = 128 - r_out, 128 + r_out, 128 - r_in, 128 + r_in
    y_leg = leg_bottom - cap
    f = lambda v: f"{v:g}"
    return (f"M{f(xo1)} {f(cy)} A{f(r_out)} {f(r_out)} 0 0 1 {f(xo2)} {f(cy)} V{f(y_leg)} "
            f"A{f(cap)} {f(cap)} 0 0 1 {f(xi2)} {f(y_leg)} V{f(cy)} "
            f"A{f(r_in)} {f(r_in)} 0 0 0 {f(xi1)} {f(cy)} V{f(y_leg)} "
            f"A{f(cap)} {f(cap)} 0 0 1 {f(xo1)} {f(y_leg)} Z "
            f"M{f(128 + dot_r)} {f(dot_cy)} A{f(dot_r)} {f(dot_r)} 0 1 0 {f(128 - dot_r)} {f(dot_cy)} "
            f"A{f(dot_r)} {f(dot_r)} 0 1 0 {f(128 + dot_r)} {f(dot_cy)} Z")

# Regular master: bbox 40..216 x 36..220 (optically centred: 4 units above canvas centre).
SYMBOL = arch(cy=124, r_out=88, stroke=34, dot_r=31, dot_cy=176, leg_bottom=220)
# Small-size cut (<= 32 px): heavier stroke, wider gaps around the dot.
SYMBOL_SMALL = arch(cy=126, r_out=90, stroke=42, dot_r=28, dot_cy=176, leg_bottom=220)
# Reversed (light on dark): thinned ~6 % against irradiation.
SYMBOL_REV = arch(cy=124, r_out=87.5, stroke=32, dot_r=30, dot_cy=176, leg_bottom=220)

wm = json.load(open("wordmark.json"))
S = 34 / 150                      # letter stem (150 u) == arch stroke (34)
ASC, DESC = 720 * S, 215 * S
WX0, WX1 = wm["bounds"][0], wm["bounds"][2]
WORD_W = (WX1 - WX0) * S

def svg(vb, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-labelledby="t">'
            f'<title id="t">{title}</title>\n{body}\n</svg>\n')

def word(tx, baseline, color):
    return f'<path fill="{color}" transform="translate({tx:.2f} {baseline:.2f}) scale({S:.5f})" d="{wm["d"]}"/>'

def sym(color, d=SYMBOL, transform=""):
    t = f' transform="{transform}"' if transform else ""
    return f'<path fill="{color}" fill-rule="evenodd"{t} d="{d}"/>'

def write(name, content): open(name, "w", encoding="utf-8").write(content)

# --- symbol masters (256 canvas)
write("littlegate-symbol.svg", svg("0 0 256 256", sym(IRIS), "Littlegate symbol"))
write("littlegate-symbol-small.svg", svg("0 0 256 256", sym(IRIS, SYMBOL_SMALL), "Littlegate symbol, small sizes"))
write("littlegate-symbol-reversed.svg", svg("0 0 256 256", sym(WHITE, SYMBOL_REV), "Littlegate symbol, reversed"))

# --- wordmark alone (baseline at y = ASC, tight crop)
write("littlegate-wordmark.svg", svg(f"0 0 {WORD_W:.1f} {ASC + DESC:.1f}", word(-WX0 * S, ASC, INK), "Littlegate wordmark"))

# --- horizontal lockup: symbol at 1:1, word baseline on the leg bottoms (y = 220)
GAP = 56
tx = 216 + GAP - WX0 * S
x1 = 216 + GAP + WORD_W
H_VB = f"40 36 {x1 - 40:.1f} {220 + DESC - 36:.1f}"
for suffix, sc, wc, d in [("", IRIS, INK, SYMBOL), ("-dark", IRIS_DARK, PAPER_DARK, SYMBOL_REV),
                         ("-black", "#000000", "#000000", SYMBOL), ("-white", WHITE, WHITE, SYMBOL_REV)]:
    write(f"littlegate-horizontal{suffix}.svg", svg(H_VB, sym(sc, d) + "\n" + word(tx, 220, wc), "Littlegate logo"))

# --- stacked lockup: symbol at 2x, centred over the word
SY = 2.0; sym_w, sym_h = 176 * SY, 184 * SY
GAP_V = 64
total_w = max(WORD_W, sym_w)
sx = (total_w - sym_w) / 2 - 40 * SY
sym_t = f"translate({sx:.2f} {-36 * SY:.2f}) scale({SY})"
base = sym_h + GAP_V + ASC
S_VB = f"0 0 {total_w:.1f} {base + DESC:.1f}"
for suffix, sc, wc, d in [("", IRIS, INK, SYMBOL), ("-dark", IRIS_DARK, PAPER_DARK, SYMBOL_REV),
                         ("-black", "#000000", "#000000", SYMBOL), ("-white", WHITE, WHITE, SYMBOL_REV)]:
    write(f"littlegate-stacked{suffix}.svg",
          svg(S_VB, sym(sc, d, sym_t) + "\n" + word((total_w - WORD_W) / 2 - WX0 * S, base, wc), "Littlegate logo"))
print("word width", round(WORD_W), "horizontal vb", H_VB, "stacked vb", S_VB)
