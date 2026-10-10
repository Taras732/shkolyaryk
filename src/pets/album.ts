/**
 * Альбом друга (модель «результат живе», 10.10.2026): що дитина правильно знайшла в іграх — лишається наліпкою.
 * Розділи: звірята («Де живе»), символи України, знахідки («Тоне чи плаває»); речі — з шафи (wardrobe.ts).
 * Незнайдене альбом показує силуетом — мета «зібрати все». Локально, по профілю.
 */
export type AlbumSection = 'animals' | 'symbols' | 'finds';
const key = (profileId: string) => `shk.album.v1.${profileId}`;

export function getAlbum(profileId: string): Record<AlbumSection, string[]> {
  try {
    const v = JSON.parse(localStorage.getItem(key(profileId)) ?? '{}');
    return { animals: v.animals ?? [], symbols: v.symbols ?? [], finds: v.finds ?? [] };
  } catch {
    return { animals: [], symbols: [], finds: [] };
  }
}

/** Повертає true, якщо наліпка нова (можна порадіти). */
export function addSticker(profileId: string | undefined, section: AlbumSection, id: string): boolean {
  if (!profileId) return false;
  const a = getAlbum(profileId);
  if (a[section].includes(id)) return false;
  a[section] = [...a[section], id];
  try {
    localStorage.setItem(key(profileId), JSON.stringify(a));
  } catch {
    // без пам'яті наліпка не збережеться
  }
  return true;
}
