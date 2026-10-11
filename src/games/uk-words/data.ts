/**
 * «Слова» (11.10.2026), 1 клас — програма Савченко [1 МОВ 4.1–4.2]: близькі й протилежні за значенням слова,
 * заміна одного звука змінює слово. Розписано вручну.
 */

/** Протилежні за значенням: пари однієї частини мови (дистрактори беремо з тієї ж групи). */
export const OPPOSITES: { a: string; b: string; kind: 'adj' | 'noun' | 'verb' | 'adv' }[] = [
  { a: 'великий', b: 'малий', kind: 'adj' },
  { a: 'гарячий', b: 'холодний', kind: 'adj' },
  { a: 'високий', b: 'низький', kind: 'adj' },
  { a: 'веселий', b: 'сумний', kind: 'adj' },
  { a: 'довгий', b: 'короткий', kind: 'adj' },
  { a: 'мокрий', b: 'сухий', kind: 'adj' },
  { a: 'старий', b: 'новий', kind: 'adj' },
  { a: 'день', b: 'ніч', kind: 'noun' },
  { a: 'світло', b: 'темрява', kind: 'noun' },
  { a: 'літо', b: 'зима', kind: 'noun' },
  { a: 'відкрити', b: 'закрити', kind: 'verb' },
  { a: 'прийти', b: 'піти', kind: 'verb' },
  { a: 'швидко', b: 'повільно', kind: 'adv' },
  { a: 'вгорі', b: 'внизу', kind: 'adv' },
];

/** Близькі за значенням; `opp` — протилежне до `a` (дистрактор, який найчастіше плутають з близьким). */
export const CLOSE: { a: string; b: string; opp: string }[] = [
  { a: 'веселий', b: 'радісний', opp: 'сумний' },
  { a: 'сміливий', b: 'хоробрий', opp: 'боязкий' },
  { a: 'гарний', b: 'красивий', opp: 'негарний' },
  { a: 'великий', b: 'величезний', opp: 'малий' },
  { a: 'маленький', b: 'крихітний', opp: 'великий' },
  { a: 'чистий', b: 'охайний', opp: 'брудний' },
  { a: 'друг', b: 'товариш', opp: 'ворог' },
  { a: 'бігти', b: 'мчати', opp: 'стояти' },
  { a: 'говорити', b: 'казати', opp: 'мовчати' },
  { a: 'швидкий', b: 'прудкий', opp: 'повільний' },
];

/** Пари слів, що різняться одним звуком: звучить `word` — знайди його картинку (поруч — картинка пари). */
export const SWAPS: { word: string; emoji: string; pair: string; pairEmoji: string }[] = [
  { word: 'кит', emoji: '🐋', pair: 'кіт', pairEmoji: '🐱' },
  { word: 'кіт', emoji: '🐱', pair: 'кит', pairEmoji: '🐋' },
  { word: 'дім', emoji: '🏠', pair: 'дим', pairEmoji: '💨' },
  { word: 'дим', emoji: '💨', pair: 'дім', pairEmoji: '🏠' },
  { word: 'ліс', emoji: '🌲', pair: 'лис', pairEmoji: '🦊' },
  { word: 'лис', emoji: '🦊', pair: 'ліс', pairEmoji: '🌲' },
  { word: 'мак', emoji: '🌺', pair: 'рак', pairEmoji: '🦞' },
  { word: 'рак', emoji: '🦞', pair: 'мак', pairEmoji: '🌺' },
  { word: 'лук', emoji: '🏹', pair: 'жук', pairEmoji: '🪲' },
  { word: 'жук', emoji: '🪲', pair: 'лук', pairEmoji: '🏹' },
  { word: 'мишка', emoji: '🐭', pair: 'миска', pairEmoji: '🥣' },
  { word: 'миска', emoji: '🥣', pair: 'мишка', pairEmoji: '🐭' },
  { word: 'гора', emoji: '⛰️', pair: 'нора', pairEmoji: '🕳️' },
  { word: 'нора', emoji: '🕳️', pair: 'гора', pairEmoji: '⛰️' },
];

/** Усі слова, які звучать (scripts/gen-uk-audio.py збирає звідси `w_<слово>`). */
export const SPOKEN = [
  ...OPPOSITES.flatMap((o) => [o.a, o.b]),
  ...CLOSE.flatMap((c) => [c.a, c.b, c.opp]),
  ...SWAPS.map((s) => s.word),
];
