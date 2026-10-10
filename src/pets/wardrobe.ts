/**
 * Шафа друга (модель «результат живе», 10.10.2026): речі, які дитина правильно обрала в «Що вдягнути?»,
 * лишаються в друга — звідти «Одягни друга» в Майстерні. Локально, по профілю.
 */
const key = (profileId: string) => `shk.wardrobe.v1.${profileId}`;

export function getWardrobe(profileId: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(profileId)) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function addToWardrobe(profileId: string, item: string) {
  const cur = getWardrobe(profileId);
  if (cur.includes(item)) return;
  try {
    localStorage.setItem(key(profileId), JSON.stringify([...cur, item]));
  } catch {
    // без пам'яті річ просто не збережеться
  }
}
