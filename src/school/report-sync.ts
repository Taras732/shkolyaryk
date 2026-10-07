import { HOMEWORK_API, loadFamilyCode } from './homework';
import { localDay } from './game-log';

/**
 * Відправка подій для вечірнього звіту батькам у Telegram (воркер `worker/homework`,
 * маршрут /event). Тихо й без повторів: немає мережі чи сімейного коду на цьому
 * пристрої — подія просто не піде, гра від цього не страждає.
 */

interface Kid {
  id: string;
  nickname: string;
}

function post(body: unknown): void {
  const code = loadFamilyCode();
  if (!HOMEWORK_API || !code) return;
  fetch(`${HOMEWORK_API.replace(/\/$/, '')}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Family-Code': code },
    body: JSON.stringify(body),
    keepalive: true, // дійде, навіть якщо дитина одразу закрила вкладку
  }).catch(() => undefined);
}

export function sendGameEvent(kid: Kid, game: { id: string; title: string; icon: string }, difficulty: number, mistakes: number): void {
  post({
    kid: { id: kid.id, name: kid.nickname.slice(0, 40) },
    day: localDay(Date.now()),
    type: 'game',
    game: { id: game.id, title: game.title.slice(0, 60), icon: game.icon.slice(0, 8), difficulty, mistakes: Math.min(mistakes, 999) },
  });
}

export function sendDaySummary(kid: Kid, summary: { afterSchoolDone: boolean; shaky: string[]; sticker?: string }): void {
  post({
    kid: { id: kid.id, name: kid.nickname.slice(0, 40) },
    day: localDay(Date.now()),
    type: 'day',
    summary: { ...summary, shaky: summary.shaky.slice(0, 10) },
  });
}

/** Сьогоднішній звіт, як його побачать батьки в Telegram (для перегляду на сторінці «Для батьків»). */
export async function fetchTodayReport(): Promise<string | null> {
  const code = loadFamilyCode();
  if (!HOMEWORK_API || !code) return null;
  try {
    const res = await fetch(`${HOMEWORK_API.replace(/\/$/, '')}/report`, { headers: { 'X-Family-Code': code } });
    if (!res.ok) return null;
    return ((await res.json()) as { text: string }).text;
  } catch {
    return null;
  }
}

/** Прив'язати Telegram: батько вже написав боту /start — воркер запам'ятовує чат і шле пробний звіт. */
export async function linkTelegram(): Promise<'ok' | 'no_start' | 'no_token' | 'error'> {
  const code = loadFamilyCode();
  if (!HOMEWORK_API || !code) return 'error';
  try {
    const res = await fetch(`${HOMEWORK_API.replace(/\/$/, '')}/telegram/link`, { method: 'POST', headers: { 'X-Family-Code': code } });
    if (res.ok) return 'ok';
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return body.error === 'no_start' || body.error === 'no_token' ? body.error : 'error';
  } catch {
    return 'error';
  }
}
