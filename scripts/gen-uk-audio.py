"""Генерує українські фрази «Знайди букву/цифру …» у public/audio/uk/ через edge-tts
і переписує src/games/shared/uk-audio-manifest.ts.

Тексти беруться з src/games/shared/spoken-names.ts (джерело правди), щоб ключі
й фрази не розійшлися з кодом.

Запуск: python scripts/gen-uk-audio.py   (потрібен pip install edge-tts)
"""
import asyncio
import re
import sys
from pathlib import Path

import edge_tts

VOICE = "uk-UA-PolinaNeural"
RATE = "-20%"  # повільніше — малюк має розчути

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "uk"
NAMES = ROOT / "src" / "games" / "shared" / "spoken-names.ts"
MANIFEST = ROOT / "src" / "games" / "shared" / "uk-audio-manifest.ts"


def phrases() -> dict[str, str]:
    src = NAMES.read_text(encoding="utf-8")
    letters = re.search(r"UK_LETTER_NAMES[^{]*\{(.*?)\};", src, re.S).group(1)
    digits = re.search(r"UK_DIGIT_NAMES = \[(.*?)\];", src, re.S).group(1)
    out = {}
    for ch, name in re.findall(r"(\S): '([^']+)'", letters):
        out[f"find_{ch}"] = f"Знайди букву {name}."
    for i, name in enumerate(re.findall(r"'([^']+)'", digits)):
        out[f"find_d{i}"] = f"Знайди цифру {name}."
    return out


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    items = phrases()
    for key, text in items.items():
        path = OUT / f"{key}.mp3"
        if path.exists():
            continue
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
        print("ok", key)
    keys = sorted(p.stem for p in OUT.glob("*.mp3"))
    body = ",\n".join(f"  '{k}'" for k in keys)
    MANIFEST.write_text(
        "/**\n"
        " * Перелік готових аудіофайлів у `public/audio/uk/` (без розширення).\n"
        " * Генерується scripts/gen-uk-audio.py — руками не правити.\n"
        " */\n"
        f"export const UK_AUDIO_FILES: ReadonlySet<string> = new Set<string>([\n{body},\n]);\n",
        encoding="utf-8",
    )
    print(f"{len(keys)} files, manifest updated")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(main())
