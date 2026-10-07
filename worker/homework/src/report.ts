import { z } from 'zod';

/**
 * Вечірній звіт батькам. Прогрес живе на пристроях дітей, тож кожна завершена
 * гра шле сюди коротку подію; о REPORT_HOUR за Києвом cron збирає день по всіх
 * дітях і надсилає одне повідомлення в Telegram — разом із тими, хто не займався.
 *
 * Зберігаємо мінімум: ім'я дитини, назва гри, складність, помилки. TTL 9 днів.
 */

export interface ReportEnv {
  REPORTS: KVNamespace;
  TG_BOT_TOKEN?: string;
  TG_CHAT_ID?: string;
  REPORT_HOUR: string;
}

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const Event = z.object({
  kid: z.object({ id: z.string().max(64), name: z.string().max(40) }),
  day: Day,
  type: z.enum(['game', 'day']),
  game: z.object({ id: z.string().max(40), title: z.string().max(60), icon: z.string().max(8), difficulty: z.number().int().min(1).max(3), mistakes: z.number().int().min(0).max(999) }).optional(),
  /** Підсумок дня з пристрою: «Після школи» зроблено, що плутає, нагорода. */
  summary: z
    .object({ afterSchoolDone: z.boolean(), shaky: z.array(z.string().max(10)).max(10), sticker: z.string().max(8).optional() })
    .optional(),
});
export type Event = z.infer<typeof Event>;

interface KidDay {
  name: string;
  games: { title: string; icon: string; difficulty: number; mistakes: number }[];
  afterSchoolDone: boolean;
  shaky: string[];
  stickers: string[];
}

const TTL = 9 * 24 * 60 * 60;
const dayKey = (day: string, kid: string) => `day:${day}:${kid}`;
const KIDS = 'kids';

export async function storeEvent(e: Event, env: ReportEnv): Promise<void> {
  const kids = ((await env.REPORTS.get(KIDS, 'json')) as Record<string, string> | null) ?? {};
  if (kids[e.kid.id] !== e.kid.name) {
    kids[e.kid.id] = e.kid.name;
    await env.REPORTS.put(KIDS, JSON.stringify(kids));
  }
  const key = dayKey(e.day, e.kid.id);
  const cur = ((await env.REPORTS.get(key, 'json')) as KidDay | null) ?? { name: e.kid.name, games: [], afterSchoolDone: false, shaky: [], stickers: [] };
  cur.name = e.kid.name;
  if (e.type === 'game' && e.game) {
    cur.games.push({ title: e.game.title, icon: e.game.icon, difficulty: e.game.difficulty, mistakes: e.game.mistakes });
    cur.games = cur.games.slice(-40);
  }
  if (e.summary) {
    cur.afterSchoolDone = cur.afterSchoolDone || e.summary.afterSchoolDone;
    cur.shaky = e.summary.shaky;
    if (e.summary.sticker && !cur.stickers.includes(e.summary.sticker)) cur.stickers.push(e.summary.sticker);
  }
  await env.REPORTS.put(key, JSON.stringify(cur), { expirationTtl: TTL });
}

/** Дата й година за Києвом — сервер живе в UTC. */
export function kyivNow(now: Date): { day: string; hour: number; label: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const label = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', day: 'numeric', month: 'long', weekday: 'long' }).format(now);
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), label };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function composeReport(label: string, kids: Record<string, string>, days: Record<string, KidDay | null>): string {
  const lines = [`📚 <b>Школярик</b> · ${esc(label)}`];
  for (const [id, name] of Object.entries(kids)) {
    const d = days[id];
    lines.push('');
    if (!d || d.games.length === 0) {
      lines.push(`<b>${esc(name)}</b> — занять сьогодні не було`);
      continue;
    }
    const mistakes = d.games.reduce((s, g) => s + g.mistakes, 0);
    lines.push(`<b>${esc(d.name)}</b> — ${d.afterSchoolDone ? '✅ «Після школи» зроблено' : '⏳ «Після школи» не до кінця'} · ігор ${d.games.length}, помилок ${mistakes}`);
    // однакові ігри — одним рядком
    const by = new Map<string, { icon: string; n: number; m: number }>();
    for (const g of d.games) {
      const x = by.get(g.title) ?? { icon: g.icon, n: 0, m: 0 };
      x.n++;
      x.m += g.mistakes;
      by.set(g.title, x);
    }
    for (const [title, x] of by) lines.push(`   ${x.icon} ${esc(title)}${x.n > 1 ? ` ×${x.n}` : ''} · помилок ${x.m}`);
    if (d.shaky.length > 0) lines.push(`   ⚠️ плутає: ${esc(d.shaky.join(', '))}`);
    if (d.stickers.length > 0) lines.push(`   🏅 наліпка: ${d.stickers.join(' ')}`);
  }
  return lines.join('\n');
}

export async function buildReport(env: ReportEnv, now: Date): Promise<{ text: string; kids: number }> {
  const { day, label } = kyivNow(now);
  const kids = ((await env.REPORTS.get(KIDS, 'json')) as Record<string, string> | null) ?? {};
  const days: Record<string, KidDay | null> = {};
  for (const id of Object.keys(kids)) days[id] = (await env.REPORTS.get(dayKey(day, id), 'json')) as KidDay | null;
  return { text: composeReport(label, kids, days), kids: Object.keys(kids).length };
}

const TG_CHAT = 'tg_chat';

/**
 * Прив'язати чат: батько пише боту /start, а тут ми беремо з getUpdates останній
 * приватний чат і запам'ятовуємо. Так не треба шукати chat_id вручну.
 */
export async function linkTelegram(env: ReportEnv): Promise<string | null> {
  if (!env.TG_BOT_TOKEN) return null;
  const res = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getUpdates`);
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: { message?: { chat?: { id: number; type: string; first_name?: string } } }[] };
  const chats = (data.result ?? []).map((u) => u.message?.chat).filter((c) => c && c.type === 'private');
  const chat = chats[chats.length - 1];
  if (!chat) return null;
  await env.REPORTS.put(TG_CHAT, String(chat.id));
  return chat.first_name ?? 'чат';
}

export async function sendTelegram(env: ReportEnv, text: string): Promise<boolean> {
  const chatId = env.TG_CHAT_ID || (await env.REPORTS.get(TG_CHAT));
  if (!env.TG_BOT_TOKEN || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  return res.ok;
}

/** Cron щогодини: надсилаємо лише в REPORT_HOUR за Києвом і лише якщо є хоч одна дитина. */
export async function scheduledReport(env: ReportEnv, now: Date): Promise<void> {
  if (kyivNow(now).hour !== Number(env.REPORT_HOUR || '20')) return;
  const { text, kids } = await buildReport(env, now);
  if (kids > 0) await sendTelegram(env, text);
}
