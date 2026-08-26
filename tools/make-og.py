# 링크 공유용 대표 이미지(1200x630).
# 카카오톡·슬랙 썸네일은 300px 안팎으로 줄어들므로, 그 크기에서도 읽히도록
# 요소를 이름/직함/머리말 셋으로만 제한하고 크게 넣는다.
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import json

# 사이트 본문과 같은 값을 쓴다 — 두 곳에 따로 적어두면 반드시 어긋난다
with open(os.path.join(ROOT, "content.json"), encoding="utf-8") as fp:
    HERO = json.load(fp)["hero"]

OUT = ROOT
W, H = 1200, 630
BG = (10, 10, 10)
WHITE = (245, 245, 245)
DIM = (215, 215, 215)
FAINT = (150, 150, 150)

FONT_VF = r"C:\Windows\Fonts\NotoSansKR-VF.ttf"
FONT_FALLBACK_BD = r"C:\Windows\Fonts\malgunbd.ttf"
FONT_FALLBACK = r"C:\Windows\Fonts\malgun.ttf"


def font(size, weight="Bold"):
    """사이트와 같은 Noto Sans KR. 가변 폰트 축 설정이 안 되면 맑은 고딕으로 대체."""
    try:
        f = ImageFont.truetype(FONT_VF, size)
        f.set_variation_by_name(weight)
        return f
    except Exception:
        path = FONT_FALLBACK_BD if weight in ("Bold", "Black", "SemiBold") else FONT_FALLBACK
        return ImageFont.truetype(path, size)


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# ---- 오른쪽: B 마크 ----
src = Image.open(os.path.join(ROOT, "assets", "brand", "mark.png")).convert("L")
mask = src.point(lambda v: 255 if v > 140 else 0).convert("L")
glyph = mask.crop(mask.getbbox())
gw, gh = glyph.size
mh = 210
mw = int(round(gw * mh / gh))
g = glyph.resize((mw, mh), Image.LANCZOS)
mark_x, mark_y = W - 96 - mw, (H - mh) // 2
img.paste(Image.new("RGB", (mw, mh), WHITE), (mark_x, mark_y), g)

# 마크와 글 사이 얇은 세로 구분선
line_x = mark_x - 64
d.line([(line_x, 200), (line_x, H - 200)], fill=(48, 48, 48), width=1)

# ---- 왼쪽: 글 ----
X = 88


def tracked(draw, xy, text, f, fill, spacing):
    """PIL 은 자간을 지원하지 않으므로 글자를 하나씩 그린다."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + spacing
    return x


f_eyebrow = font(21, "Medium")
f_name = font(104, "Black")
f_sub = font(37, "Medium")

y = 214
tracked(d, (X, y), HERO["eyebrow"].upper(), f_eyebrow, FAINT, 3.4)

y += 52
d.text((X, y), HERO["name"], font=f_name, fill=WHITE)

y += 138
d.text((X, y), HERO["subtitle"], font=f_sub, fill=DIM)

path = os.path.join(OUT, "og-image.png")
img.save(path, optimize=True)
print(f"og-image.png  {W}x{H}  {os.path.getsize(path)/1024:.1f} KB")

# 카톡 썸네일 크기로 줄였을 때 확인
