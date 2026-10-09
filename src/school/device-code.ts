/**
 * Одноразовий код підключення пристрою дитини (рішення 09.10.2026): 6 цифр, діє 15 хв.
 * Після входу за кодом пристрій запамʼятовує дитину й відкривається одразу на її головній.
 *
 * TODO(supabase): зараз коди лежать у localStorage цього ж браузера — флоу перевіряється
 * лише на одному пристрої. Справжня звірка — таблиця на сервері (код → профіль, термін).
 */
const CODES_KEY = 'shk.codes.v1';
const DEVICE_KEY = 'shk.deviceChild';
export const CODE_TTL_MS = 15 * 60 * 1000;

type Codes = Record<string, { profileId: string; until: number }>;

function read(): Codes {
  try {
    return JSON.parse(localStorage.getItem(CODES_KEY) ?? '{}') as Codes;
  } catch {
    return {};
  }
}

function write(c: Codes) {
  try {
    localStorage.setItem(CODES_KEY, JSON.stringify(c));
  } catch {
    // без памʼяті код просто не спрацює — батьки згенерують новий
  }
}

/** Новий код для дитини; протерміновані прибираємо заодно. */
export function issueCode(profileId: string): { value: string; until: number } {
  const now = Date.now();
  const codes = Object.fromEntries(Object.entries(read()).filter(([, v]) => v.until > now));
  let value = '';
  do value = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
  while (codes[value]);
  const until = now + CODE_TTL_MS;
  codes[value] = { profileId, until };
  write(codes);
  return { value, until };
}

/** Код → профіль дитини (одноразово: використаний код зникає). null — невірний чи протермінований. */
export function redeemCode(value: string): string | null {
  const codes = read();
  const hit = codes[value];
  if (!hit) return null;
  delete codes[value];
  write(codes);
  return hit.until > Date.now() ? hit.profileId : null;
}

/** Чия це дитина на цьому пристрої (після входу за кодом). */
export function deviceChild(): string | null {
  try {
    return localStorage.getItem(DEVICE_KEY);
  } catch {
    return null;
  }
}

export function setDeviceChild(profileId: string) {
  try {
    localStorage.setItem(DEVICE_KEY, profileId);
  } catch {
    // не запамʼятали — наступного разу буде «Хто грає?»
  }
}
