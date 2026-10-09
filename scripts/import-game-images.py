"""PNG з kuznya-image-gen/output/shkolyaryk_games → public/games/<id>.webp (512px, ~quality 82).
Запуск: python scripts/import-game-images.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path("D:/Dev/kuznya-image-gen/output/shkolyaryk_games")
DST = Path(__file__).resolve().parent.parent / "public" / "games"
DST.mkdir(parents=True, exist_ok=True)

n = 0
for png in sorted(SRC.glob("*.png")):
    out = DST / f"{png.stem}.webp"
    im = Image.open(png).convert("RGB")
    # кремове тло генератора → біле: на картці з mix-blend-mode: multiply біле зникає
    a = np.asarray(im).astype(np.int16)
    bg = np.median(np.concatenate([a[:8, :8].reshape(-1, 3), a[:8, -8:].reshape(-1, 3), a[-8:, :8].reshape(-1, 3), a[-8:, -8:].reshape(-1, 3)]), axis=0)
    dist = np.abs(a - bg).sum(axis=2)
    lift = np.clip((60 - dist) / 30, 0, 1)[..., None]  # близьке до тла — у біле, з мʼяким краєм
    a = (a * (1 - lift) + 255 * lift).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(a)
    im.thumbnail((512, 512))
    im.save(out, "WEBP", quality=82, method=6)
    n += 1
print(f"{n} webp -> {DST}")
