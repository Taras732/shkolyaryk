"""Генерує українську озвучку в public/audio/uk/ через edge-tts і переписує uk-audio-manifest.ts.

Фраза й ціль — ОКРЕМИМИ файлами (рішення 09.10.2026): «Знайди букву» + пауза + «бе».
Злита фраза «Знайди букву бе» звучала нечітко — назва букви губилася в кінці речення.
Назви букв і цифр — повільніше, кожна як самостійне слово.

Тексти беруться з src/games/shared/spoken-names.ts (джерело правди).
Запуск: python scripts/gen-uk-audio.py   (потрібен pip install edge-tts)
"""
import asyncio
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

VOICE = "uk-UA-PolinaNeural"
RATE_PHRASE = "-15%"
RATE_NAME = "-35%"  # назва букви/цифри — повільно й чітко
# слова — майже звичайний темп: на -35% синтезатор «ковтав» кінець («кіт» звучав як «кін», 09.10)
RATE_WORD = "-15%"

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "uk"
NAMES = ROOT / "src" / "games" / "shared" / "spoken-names.ts"
MANIFEST = ROOT / "src" / "games" / "shared" / "uk-audio-manifest.ts"


def items() -> dict[str, tuple[str, str]]:
    src = NAMES.read_text(encoding="utf-8")
    letters = re.search(r"UK_LETTER_NAMES[^{]*\{(.*?)\};", src, re.S).group(1)
    digits = re.search(r"UK_DIGIT_NAMES = \[(.*?)\];", src, re.S).group(1)
    out = {
        "p_find_letter": ("Знайди букву.", RATE_PHRASE),
        "p_find_digit": ("Знайди цифру.", RATE_PHRASE),
    }
    for ch, name in re.findall(r"(\S): '([^']+)'", letters):
        out[f"n_{ch}"] = (f"{name.capitalize()}.", RATE_NAME)
    for i, name in enumerate(re.findall(r"'([^']+)'", digits)):
        out[f"d_{i}"] = (f"{name.capitalize()}.", RATE_NAME)
    # буквар: слово-опора (w_<слово>) і знайомство з буквою (l_<буква>)
    names = dict(re.findall(r"(\S): '([^']+)'", letters))
    lsrc = (ROOT / "src" / "games" / "uk-letters" / "letters.ts").read_text(encoding="utf-8")
    for word in re.findall(r"\['([^']+)', '[^']+'\]", lsrc):
        out[f"w_{word}"] = (f"{word.capitalize()}!", RATE_WORD)
    for ch, word in re.findall(r"L\('(.)', '([^']+)'", lsrc):
        out[f"w_{word}"] = (f"{word.capitalize()}!", RATE_WORD)
        out[f"l_{ch}"] = (f"Це буква {names.get(ch, ch)}. {word.capitalize()}.", RATE_PHRASE)
    # склади (s_<СКЛАД>), протяжні звуки (c_<БУКВА>) і слова «склад + звук» — для «Зливаємо склади»
    ssrc = (ROOT / "src" / "games" / "uk-syllables" / "core.ts").read_text(encoding="utf-8")
    long_ = re.findall(r"'(.)'", re.search(r"LONG = \[(.*?)\]", ssrc).group(1))
    short_ = re.findall(r"'(.)'", re.search(r"SHORT = \[(.*?)\]", ssrc).group(1))
    vowels = re.findall(r"'(.)'", re.search(r"VOWELS = \[(.*?)\]", ssrc).group(1))
    for c in long_ + short_:
        for v in vowels:
            out[f"s_{c}{v}"] = (f"{(c + v).lower()}.", RATE_NAME)
    for c in long_:
        out[f"c_{c}"] = (f"{c.lower() * 6}.", "-50%")
    for word in re.findall(r"word: '([^']+)'", ssrc):
        out[f"w_{word.lower()}"] = (f"{word.capitalize()}!", RATE_WORD)
    # «Склади слово»: слова і плитки-склади
    bsrc = (ROOT / "src" / "games" / "syllable-build" / "core.ts").read_text(encoding="utf-8")
    for word, parts in re.findall(r"word: '([^']+)', parts: \[([^\]]+)\]", bsrc):
        out.setdefault(f"w_{word.lower()}", (f"{word.capitalize()}!", RATE_WORD))
        for p in re.findall(r"'([^']+)'", parts):
            if len(p) > 1:
                out.setdefault(f"s_{p}", (f"{p.lower()}.", RATE_NAME))
    for word in re.findall(r"L\('([^']+)'", bsrc):
        out.setdefault(f"w_{word.lower()}", (f"{word.capitalize()}!", RATE_WORD))
    for p in re.findall(r"'([А-ЯІЄЇҐ]{2})'", re.search(r"EXTRA_SYLS = \[(.*?)\]", bsrc).group(1)):
        out.setdefault(f"s_{p}", (f"{p.lower()}.", RATE_NAME))
    # «Що тут зайве?»: завдання і пояснення («Решта — фрукти»)
    osrc = (ROOT / "src" / "games" / "odd-one-out" / "core.ts").read_text(encoding="utf-8")
    out["p_odd"] = ("Що тут зайве?", RATE_PHRASE)
    out["p_remember"] = ("Запамʼятай!", RATE_PHRASE)
    out["p_changed"] = ("Що змінилось?", RATE_PHRASE)
    out["p_fly"] = ("Лови світлячків!", RATE_PHRASE)
    out["p_fly_bee"] = ("Лови світлячків, але не чіпай бджілку!", RATE_PHRASE)
    out["pre.done"] = ("Ура! Гру пройдено!", RATE_PHRASE)
    # Лічильна Гора (10.10)
    out["p_count"] = ("Скільки тут?", RATE_PHRASE)
    out["p_more"] = ("Де більше?", RATE_PHRASE)
    out["p_sum"] = ("Скільки разом?", RATE_PHRASE)
    out["p_share"] = ("Розклади порівну!", RATE_PHRASE)
    out["p_more_who"] = ("У кого більше?", RATE_PHRASE)
    out["p_pour"] = ("Налий рівно до зірочки!", RATE_PHRASE)
    out["odd_same"] = ("Молодець! Решта — однакові.", RATE_PHRASE)
    for cid, plural in re.findall(r"id: '([a-z]+)', plural: '([^']+)'", osrc):
        out[f"odd_{cid}"] = (f"Молодець! Решта — {plural}.", RATE_PHRASE)
    return out


# Винятки (09.10.2026, прослухав Тарас): український голос читає окрему «И» як «І»,
# а знак «ы» вимовити відмовляється. Назва «И» — звук «ы» іншим голосом (вибір Тараса, варіант K);
# знайомство з «И» — без окремої букви, через слово.
OVERRIDES: dict[str, tuple[str, str, str]] = {
    "n_И": ("ru-RU-SvetlanaNeural", "Ы.", RATE_NAME),
    "l_И": (VOICE, "Ця буква звучить у слові кит. Кит.", RATE_PHRASE),
}


def trim_tail(path: Path) -> None:
    """Хвіст тиші edge-tts (~1.1 с) обрізаємо до 0.15 с: інакше між «Знайди цифру» і «пʼять»
    виходить півтори секунди (Тарас 10.10: «скоротити вдвічі»). Повторний прогін нічого не змінює."""
    tmp = path.with_suffix(".tmp.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path), "-af",
         "areverse,silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.15,areverse",
         "-b:a", "48k", str(tmp)],
        check=True,
    )
    tmp.replace(path)


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, (text, rate) in items().items():
        path = OUT / f"{key}.mp3"
        if path.exists():
            continue
        voice = VOICE
        if key in OVERRIDES:
            voice, text, rate = OVERRIDES[key]
        await edge_tts.Communicate(text, voice, rate=rate).save(str(path))
        trim_tail(path)
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
    if "--trim-all" in sys.argv:
        for f in sorted(OUT.glob("*.mp3")):
            trim_tail(f)
        print("trimmed all")
    asyncio.run(main())
