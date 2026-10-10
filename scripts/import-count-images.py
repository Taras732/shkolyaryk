"""PNG з kuznya-image-gen/output/shkolyaryk_counting → public/count/<key>.webp з прозорим тлом.
rembg вирізає тло, обрізаємо по вмісту; предмети 256px, герої 512px.
Запуск: python scripts/import-count-images.py
"""
from pathlib import Path
from PIL import Image
from PIL import ImageDraw
from rembg import remove

# rembg зрізає світлі деталі (пелюстки соняшника 10.10) — для чисто білого тла заливаємо від кутів
FLOOD = {"sym_sunflower", "pg_sun"}
# генератор інколи дописує текст унизу — обрізаємо частку висоти знизу (pg_sun 10.10)
CROP_BOTTOM = {"pg_sun": 0.8}


def flood_cut(img):
    img = img.convert("RGBA")
    rgb = img.convert("RGB")
    w, h = img.size
    for c in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(rgb, c, (255, 0, 255), thresh=40)
    px, a = rgb.load(), img.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == (255, 0, 255):
                a[x, y] = (0, 0, 0, 0)
    return img

SRC = Path("D:/Dev/kuznya-image-gen/output/shkolyaryk_counting")
DST = Path(__file__).resolve().parent.parent / "public" / "count"
DST.mkdir(parents=True, exist_ok=True)
HEROES = {"penguin", "polar_bear", "frog", "lion", "bunny", "bear", "mouse", "chick", "hedgehog", "cat", "fox", "dog", "pig", "cow", "horse", "elephant"}

sheet = []
for png in sorted(p for p in SRC.glob("*.png") if not p.stem.startswith("_")):
    if png.stem.startswith(("sea_", "hab_")):  # сцени (пори року) — повна картинка, без вирізання тла
        im = Image.open(png).convert("RGB")
        im.thumbnail((320, 320))
        im.save(DST / f"{png.stem}.webp", "WEBP", quality=82, method=6)
        print("ok", png.stem, im.size)
        continue
    im = flood_cut(Image.open(png)) if png.stem in FLOOD else remove(Image.open(png).convert("RGBA"))
    if png.stem in CROP_BOTTOM:
        im = im.crop((0, 0, im.width, int(im.height * CROP_BOTTOM[png.stem])))
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox())
    side = 512 if png.stem in HEROES or png.stem.startswith(("cyc_", "as_", "sym_")) else 256
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
