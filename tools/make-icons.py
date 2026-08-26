# 원본 마크에서 글자 모양만 추출해 사이트 배경색(#0a0a0a) 위에 다시 그린다.
# 작은 크기일수록 글자를 크게 잡아야 B의 안쪽 구멍이 뭉개지지 않는다.
from PIL import Image
import io, os, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SRC = os.path.join(ROOT, "assets", "brand", "mark.png")
OUT = ROOT
BG = (10, 10, 10)          # --bg 와 동일
FG = (255, 255, 255)

src = Image.open(SRC).convert("L")
mask = src.point(lambda v: 255 if v > 140 else 0).convert("L")
glyph = mask.crop(mask.getbbox())
GW, GH = glyph.size


def render(size, glyph_img, fit=0.86):
    """정사각 캔버스 중앙에 배치. 가로가 긴 마크는 폭 기준, 세로가 긴 마크는 높이 기준으로 맞춘다."""
    gw, gh = glyph_img.size
    canvas = Image.new("RGB", (size, size), BG)
    if gw >= gh:
        tw = int(round(size * fit)); th = max(1, int(round(gh * tw / gw)))
    else:
        th = int(round(size * fit)); tw = max(1, int(round(gw * th / gh)))
    g = glyph_img.resize((tw, th), Image.LANCZOS)
    canvas.paste(Image.new("RGB", (tw, th), FG), ((size - tw) // 2, (size - th) // 2), g)
    return canvas


def write_ico(path, frames):
    """PNG 프레임을 담은 멀티사이즈 ICO. 크기마다 따로 렌더한 것을 그대로 넣는다."""
    blobs = []
    for img in frames:
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        blobs.append((img.size[0], buf.getvalue()))

    header = struct.pack("<HHH", 0, 1, len(blobs))
    offset = 6 + 16 * len(blobs)
    entries, data = b"", b""
    for size, blob in blobs:
        entries += struct.pack("<BBBBHHII", size if size < 256 else 0, size if size < 256 else 0,
                               0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
        data += blob
    with open(path, "wb") as f:
        f.write(header + entries + data)


# C 와 J 는 서로 붙어 있어 한 덩어리로 잘린다. 16px 에서는 세 글자가 뭉개지므로
# 가장 작은 프레임만 'CJ' 로 대체하고, 32px 이상은 CJH 전체를 쓴다.
CJ_SPLIT = 475
cj = glyph.crop((0, 0, CJ_SPLIT, glyph.size[1]))

write_ico(os.path.join(OUT, "favicon.ico"),
          [render(16, cj, 0.86), render(32, glyph, 0.90), render(48, glyph, 0.88)])

# iOS 홈 화면 아이콘은 모서리가 둥글게 잘리므로 여백을 넉넉히
render(180, glyph, 0.72).save(os.path.join(OUT, "apple-touch-icon.png"), optimize=True)
render(512, glyph, 0.76).save(os.path.join(OUT, "icon-512.png"), optimize=True)

for f in ("favicon.ico", "apple-touch-icon.png", "icon-512.png"):
    p = os.path.join(OUT, f)
    print(f"{f:22} {os.path.getsize(p)/1024:6.1f} KB")

prev = Image.new("RGB", (16 * 2 + 32 * 2 + 48 * 2 + 60, 110), (40, 40, 40))
x = 8
for s_, gl, r in ((16, cj, 0.86), (32, glyph, 0.90), (48, glyph, 0.88)):
    im = render(s_, gl, r)
    prev.paste(im, (x, 8))
    prev.paste(im.resize((s_ * 2, s_ * 2), Image.NEAREST), (x, 8 + s_ + 8))
    x += s_ * 2 + 16
