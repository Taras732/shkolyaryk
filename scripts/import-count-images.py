"""PNG з kuznya-image-gen/output/shkolyaryk_counting → public/count/<key>.webp з прозорим тлом.
rembg вирізає тло, обрізаємо по вмісту; предмети 256px, герої 512px.
Запуск: python scripts/import-count-images.py
"""
from pathlib import Path
from PIL import Image
from rembg import remove

SRC = Path("D:/Dev/kuznya-image-gen/output/shkolyaryk_counting")
DST = Path(__file__).resolve().parent.parent / "public" / "count"
DST.mkdir(parents=True, exist_ok=True)
HEROES = {"bunny", "bear", "mouse", "chick", "hedgehog", "cat", "fox", "dog", "pig", "cow", "horse", "elephant"}

sheet = []
for png in sorted(p for p in SRC.glob("*.png") if not p.stem.startswith("_")):
    im = remove(Image.open(png).convert("RGBA"))
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox())
    side = 512 if png.stem in HEROES or png.stem.startswith("cyc_") else 256
    im.thumbnail((side, side))
    im.save(DST / f"{png.stem}.webp", "WEBP", quality=85, method=6)
    sheet.append(im)
    print("ok", png.stem, im.size)

# аркуш для огляду
W = 180
board = Image.new("RGB", (W * 6, W * 4), (255, 243, 214))
for i, im in enumerate(sheet):
    t = im.copy()
    t.thumbnail((W - 20, W - 20))
    board.paste(t, ((i % 6) * W + (W - t.width) // 2, (i // 6) * W + (W - t.height) // 2), t)
board.save(SRC / "_sheet.png")
