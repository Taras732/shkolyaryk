import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Речення і текст 4» (11.10.2026) — 4 клас, програма Савченко:
 *  d1 — однорідні члени речення й коми між ними;
 *  d2 — звʼязок речень: чим замінити повтор у другому реченні;
 *  d3 — короткий текст: головна думка, герой, що сталося далі, план для переказу.
 * Усі речення й тексти власні.
 */

/** Коми: перша форма правильна, три інші — хибні (коми не там, зайві або їх немає). */
export const COMMAS: { right: string; wrong: [string, string, string]; why: string }[] = [
  { right: 'У кошику лежали яблука, груші, сливи.', wrong: ['У кошику лежали яблука груші, сливи.', 'У кошику, лежали яблука груші сливи.', 'У кошику лежали яблука груші сливи.'], why: 'Однорідні члени (яблука, груші, сливи) розділяємо комами.' },
  { right: 'Я люблю малювати, співати і танцювати.', wrong: ['Я люблю малювати співати, і танцювати.', 'Я люблю малювати, співати, і танцювати.', 'Я люблю малювати співати і танцювати.'], why: 'Перед одиничним «і» коми не ставимо; між першими двома словами — ставимо.' },
  { right: 'Маленький, але сміливий песик захищав двір.', wrong: ['Маленький але, сміливий песик захищав двір.', 'Маленький але сміливий, песик захищав двір.', 'Маленький але сміливий песик захищав двір.'], why: 'Перед «але» завжди ставимо кому.' },
  { right: 'Ми не гуляли, а читали книжки.', wrong: ['Ми не гуляли а, читали книжки.', 'Ми не гуляли а читали книжки.', 'Ми, не гуляли а читали книжки.'], why: 'Перед «а» завжди ставимо кому.' },
  { right: 'У лісі ростуть дуби, берези й клени.', wrong: ['У лісі ростуть дуби, берези, й клени.', 'У лісі ростуть дуби берези й клени.', 'У лісі, ростуть дуби берези й клени.'], why: 'Між «дуби» і «берези» — кома, а перед одиничним «й» — ні.' },
  { right: 'На уроці ми писали, читали і малювали.', wrong: ['На уроці ми писали читали, і малювали.', 'На уроці ми писали, читали, і малювали.', 'На уроці ми писали читали і малювали.'], why: 'Однорідні присудки розділяємо комою, а перед одиничним «і» коми нема.' },
  { right: 'Тато купив хліб, молоко, сир і мед.', wrong: ['Тато купив хліб молоко, сир і мед.', 'Тато купив хліб, молоко, сир, і мед.', 'Тато купив хліб молоко сир і мед.'], why: 'Між «хліб», «молоко», «сир» — коми, а перед одиничним «і» коми нема.' },
  { right: 'Вона не плакала, а сміялася.', wrong: ['Вона не плакала а, сміялася.', 'Вона, не плакала а сміялася.', 'Вона не плакала а сміялася.'], why: 'Перед «а» ставимо кому.' },
];

/** Повтор слова: перше речення, друге з пропуском, варіанти заміни. */
export const LINKS: { s1: string; s2: string; rep: string; right: string; wrong: [string, string, string] }[] = [
  { s1: 'Оля купила нову сукню.', s2: '___ одягла сукню на свято.', rep: 'Оля', right: 'Вона', wrong: ['Він', 'Вони', 'Воно'] },
  { s1: 'Богдан знайшов кошеня.', s2: '___ приніс його додому.', rep: 'Богдан', right: 'Він', wrong: ['Вона', 'Вони', 'Воно'] },
  { s1: 'Діти прийшли в парк.', s2: '___ гралися на гойдалках.', rep: 'Діти', right: 'Вони', wrong: ['Ми', 'Вона', 'Він'] },
  { s1: 'Мама спекла пиріг.', s2: '___ був дуже смачний.', rep: 'Пиріг', right: 'Він', wrong: ['Вона', 'Вони', 'Воно'] },
  { s1: 'Над лісом летить орел.', s2: '___ шукає здобич.', rep: 'Орел', right: 'Птах', wrong: ['Нора', 'Квітка', 'Лід'] },
  { s1: 'Лис підкрався до курника.', s2: '___ тихо відчинив двері.', rep: 'Лис', right: 'Рудий хитрун', wrong: ['Сірий вовк', 'Білий заєць', 'Старий пень'] },
  { s1: 'Київ — столиця України.', s2: '___ стоїть на Дніпрі.', rep: 'Київ', right: 'Це місто', wrong: ['Ця річка', 'Це село', 'Ця країна'] },
  { s1: 'Я і Максим любимо футбол.', s2: '___ граємо щосуботи.', rep: 'Я і Максим', right: 'Ми', wrong: ['Вони', 'Ви', 'Він'] },
  { s1: 'Сонечко засяяло.', s2: '___ зігріло все навколо.', rep: 'Сонечко', right: 'Воно', wrong: ['Він', 'Вона', 'Вони'] },
];

export interface Story {
  title: string;
  s: string[];
  idea: { right: string; wrong: [string, string] };
  hero: { q: string; right: string; wrong: [string, string] };
  after: { q: string; right: string; wrong: [string, string] };
  /** Пункти плану в правильному порядку (за ходом подій у тексті) */
  plan: string[];
}
export const STORIES: Story[] = [
  {
    title: 'Годівничка',
    s: ['Узимку в нашому дворі випав глибокий сніг.', 'Синички не могли знайти їжу.', 'Максим узяв пластикову пляшку й виготовив годівничку.', 'Він насипав у неї зернят і повісив на гілку яблуні.', 'Уже наступного ранку прилетіли перші гості.', 'Тепер Максим щодня підсипає зерно.'],
    idea: { right: 'Як хлопчик допоміг птахам узимку', wrong: ['Як вирісла яблуня у дворі', 'Як випав перший сніг'] },
    hero: { q: 'Який Максим?', right: 'турботливий', wrong: ['байдужий', 'лінивий'] },
    after: { q: 'Що сталося після того, як Максим повісив годівничку на гілку?', right: 'Прилетіли синички', wrong: ['Випав глибокий сніг', 'Максим узяв пляшку'] },
    plan: ['Глибокий сніг у дворі', 'Годівничка з пляшки', 'Перші гості на годівничці', 'Зерно щодня'],
  },
  {
    title: 'Загублений песик',
    s: ['Дівчинка Соломія гуляла в парку й побачила маленького песика.', 'Він тремтів і скиглив біля лавки.', 'На нашийнику Соломія знайшла номер телефону.', 'Вона зателефонувала господареві.', 'За десять хвилин прибіг схвильований хлопчик і міцно обійняв свого друга.', 'Песик радісно замахав хвостом.'],
    idea: { right: 'Як дівчинка допомогла песикові знайти господаря', wrong: ['Як хлопчик навчав песика команд', 'Як Соломія гуляла в парку'] },
    hero: { q: 'Яка Соломія?', right: 'уважна й добра', wrong: ['байдужа', 'вередлива'] },
    after: { q: 'Що сталося після того, як Соломія зателефонувала господареві?', right: 'Прибіг хлопчик і обійняв песика', wrong: ['Соломія пішла додому', 'Песик утік у парк'] },
    plan: ['Песик біля лавки', 'Номер на нашийнику', 'Дзвінок господареві', 'Радісна зустріч'],
  },
  {
    title: 'Велике яблуко',
    s: ['Восени їжачок Колючка збирав яблука на зиму.', 'Одне яблуко було таке велике, що він ніяк не міг його підняти.', 'Колючка покликав на допомогу білку Рудку.', 'Удвох вони покотили яблуко до нірки.', 'Увечері білка залишилась ночувати в теплій норі.', 'Узимку друзі разом ласували яблуком.'],
    idea: { right: 'Друзі допомагають один одному', wrong: ['Їжак не любить яблука', 'Білка живе в дуплі'] },
    hero: { q: 'Яка білка Рудка?', right: 'готова допомогти', wrong: ['жадібна', 'сердита'] },
    after: { q: 'Що сталося після того, як Колючка покликав білку?', right: 'Удвох вони покотили яблуко до нірки', wrong: ['Колючка зʼїв яблуко сам', 'Білка пішла в ліс'] },
    plan: ['Велике яблуко', 'Поклик на допомогу', 'Яблуко котиться до нірки', 'Зимовий частунок'],
  },
  {
    title: 'Складна задача',
    s: ['Орест дуже хвилювався перед шкільним конкурсом.', 'Він ніяк не міг розвʼязати останню задачу.', 'Хлопчик глибоко вдихнув і ще раз уважно прочитав умову.', 'Раптом він помітив підказку в запитанні.', 'Задача розвʼязалась!', 'Орест здобув друге місце й дуже пишався собою.'],
    idea: { right: 'Спокій і уважність допомагають розвʼязати складну задачу', wrong: ['У школі проводять конкурси', 'Друге місце — найкраще'] },
    hero: { q: 'Який Орест?', right: 'наполегливий', wrong: ['лінивий', 'неуважний'] },
    after: { q: 'Що сталося після того, як Орест уважно прочитав умову?', right: 'Він помітив підказку', wrong: ['Він здав порожній аркуш', 'Він пішов із конкурсу'] },
    plan: ['Хвилювання перед конкурсом', 'Складна задача', 'Уважне читання умови', 'Друге місце'],
  },
  {
    title: 'Писанка',
    s: ['Бабуся Галя вчила Дарину писати писанки.', 'Спочатку вони розтопили віск і набрали його в маленький писачок.', 'Потім Дарина обережно намалювала воском візерунок на яйці.', 'Яйце опустили в жовту фарбу.', 'Коли воно висохло, віск розтопили над свічкою.', 'На яйці засяяв дивовижний візерунок.'],
    idea: { right: 'Як бабуся навчила онуку писати писанку', wrong: ['Як вирощують курей', 'Як фарбують стіни'] },
    hero: { q: 'Яка бабуся Галя?', right: 'терпляча', wrong: ['сердита', 'неуважна'] },
    after: { q: 'Що сталося після того, як яйце опустили в жовту фарбу?', right: 'Яйце висушили, а віск розтопили над свічкою', wrong: ['Дарина зʼїла яйце', 'Бабуся розтопила віск для писачка'] },
    plan: ['Набрати віск у писачок', 'Намалювати візерунок воском', 'Занурити яйце в фарбу', 'Зняти віск над свічкою'],
  },
  {
    title: 'Мʼяч у чужому городі',
    s: ['У суботу в нашому дворі зібралися друзі на футбол.', 'Команда Андрія вигравала два на нуль.', 'Раптом мʼяч улетів у чужий город.', 'Андрій вибачився перед господинею і дістав його.', 'Господиня усміхнулась і пригостила хлопців яблуками.', 'Матч продовжився.'],
    idea: { right: 'Чемність допомагає владнати незручну ситуацію', wrong: ['Футбол — найкраща гра', 'Яблука дуже корисні'] },
    hero: { q: 'Який Андрій?', right: 'чемний', wrong: ['грубий', 'хвалькуватий'] },
    after: { q: 'Що сталося після того, як мʼяч улетів у город?', right: 'Андрій вибачився й дістав мʼяч', wrong: ['Матч закінчився', 'Господиня забрала мʼяч'] },
    plan: ['Друзі зібралися на футбол', 'Мʼяч у чужому городі', 'Вибачення господині', 'Яблука для хлопців'],
  },
];

/** Номери речень тексту (з 0), до яких привʼязано пункти плану — лише для перевірки порядку в тесті */
export const PLAN_AT: number[][] = [[0, 2, 4, 5], [1, 2, 3, 4], [1, 2, 3, 5], [0, 1, 2, 5], [1, 2, 3, 4], [0, 2, 3, 4]];

type Payload =
  | { mode: 'comma'; options: string[]; why: string }
  | { mode: 'links'; s1: string; s2: string; rep: string; options: string[] }
  | { mode: 'idea' | 'hero' | 'after'; q: string; text: string; options: string[]; title: string }
  | { mode: 'plan'; text: string; parts: string[]; title: string };
type Answer = string;
export const PLAN_SEP = ' → ';

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    for (const c of shuffle(COMMAS).slice(0, 5)) items.push({ payload: { mode: 'comma', options: shuffle([c.right, ...c.wrong]), why: c.why }, answer: c.right });
  } else if (difficulty === 2) {
    for (const l of shuffle(LINKS).slice(0, 5)) items.push({ payload: { mode: 'links', s1: l.s1, s2: l.s2, rep: l.rep, options: shuffle([l.right, ...l.wrong]) }, answer: l.right });
  } else {
    const kinds = ['idea', 'hero', 'after', 'plan', 'plan'] as const;
    shuffle(STORIES).slice(0, 5).forEach((st, i) => {
      const text = st.s.join(' ');
      const k = kinds[i];
      if (k === 'plan') items.push({ payload: { mode: 'plan', text, title: st.title, parts: shuffle([...st.plan]) }, answer: st.plan.join(PLAN_SEP) });
      else {
        const src = st[k];
        const q = k === 'idea' ? 'Яка головна думка тексту?' : src === st.hero ? st.hero.q : st.after.q;
        items.push({ payload: { mode: k, q, text, title: st.title, options: shuffle([src.right, ...src.wrong]) }, answer: src.right });
      }
    });
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

/** Тап по пунктах плану в правильному порядку; не те — хитається. */
function OrderBoard({ parts, answer, disabled, onDone }: { parts: string[]; answer: string; disabled: boolean; onDone: (v: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const tap = (s: string) => {
    if (disabled || picked.includes(s)) return;
    const nx = [...picked, s];
    if (!(answer + PLAN_SEP).startsWith(nx.join(PLAN_SEP) + PLAN_SEP)) { setShake(s); window.setTimeout(() => setShake(null), 400); return; }
    setPicked(nx);
    if (nx.length === parts.length) window.setTimeout(() => onDone(nx.join(PLAN_SEP)), 300);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {picked.map((s, k) => <div key={s} style={{ padding: '6px 10px', borderRadius: 12, background: '#DCFCE7', fontWeight: 700 }}><b>{k + 1}.</b> {s}</div>)}
      {parts.filter((s) => !picked.includes(s)).map((s) => (
        <button key={s} type="button" onClick={() => tap(s)}
          style={{ border: 0, borderRadius: 14, padding: '10px 12px', fontSize: 16, fontWeight: 700, textAlign: 'left', background: '#fff', boxShadow: '0 4px 0 #E5E7EB', cursor: 'pointer', animation: shake === s ? 'pk-shake .4s ease' : undefined }}>
          {s}
        </button>
      ))}
    </div>
  );
}

const PHRASES = {
  comma: { key: 'p_t4_comma', text: 'Де правильно поставлено коми?' },
  links: { key: 'p_t4_links', text: 'Чим замінити повтор у другому реченні?' },
  idea: { key: 'p_t4_idea', text: 'Прочитай текст. Яка головна думка?' },
  hero: { key: 'p_t4_hero', text: 'Прочитай текст і дай відповідь.' },
  after: { key: 'p_t4_after', text: 'Прочитай текст. Що сталося далі?' },
  plan: { key: 'p_t4_plan', text: 'Розклади пункти плану по порядку.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const textStyle = { fontSize: 16, fontWeight: 600, lineHeight: 1.5, textAlign: 'left' as const };
  if (p.mode === 'plan') {
    return (
      <>
        <PromptCard question={`«${p.title}». ${phrase.text}`} answerState={answerState} say={say} sayKey={round.id}>
          <div style={textStyle}>{p.text}</div>
        </PromptCard>
        <OrderBoard key={round.id} parts={p.parts} answer={String(round.answer)} disabled={disabled} onDone={onAnswer} />
      </>
    );
  }
  const question = p.mode === 'comma' ? phrase.text : p.mode === 'links' ? `${phrase.text} (слово «${p.rep}»)` : `«${p.title}». ${p.q}`;
  return (
    <>
      <PromptCard question={question} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'links' && <div style={{ ...textStyle, fontSize: 18 }}>{p.s1} {p.s2}</div>}
        {(p.mode === 'idea' || p.mode === 'hero' || p.mode === 'after') && <div style={textStyle}>{p.text}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 16, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={1} />
    </>
  );
}

const text4: GameDefinition<Payload, Answer> = {
  id: 'text-4',
  title: 'Речення і текст 4',
  subject: 'language',
  levels: ['L3'],
  icon: '📝',
  description: 'Коми між однорідними членами, звʼязок речень у тексті, головна думка й план для переказу.',
  accent: '#E0E7FF',
  skillsFor: (d) => (d === 1 ? ['language.text.l4.homogeneous-members'] : d === 2 ? ['language.text.l4.text-links'] : ['language.reading.l4.main-idea', 'language.reading.l4.text-analysis', 'language.text.l4.written-retelling']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'comma') return { steps: [String(round.answer), p.why] };
    if (p.mode === 'links') return { steps: [`${p.s1} ${p.s2.replace('___', String(round.answer))}`, `Щоб не повторювати слово «${p.rep}», замінюємо його: ${round.answer}.`] };
    if (p.mode === 'idea') return { steps: [String(round.answer), 'Головна думка — про що весь текст, а не одна дрібна подробиця.'] };
    if (p.mode === 'hero') return { steps: [`Про героя кажуть його вчинки: ${round.answer}.`, 'Знайди в тексті, що він робить, і подумай, яким його це показує.'] };
    if (p.mode === 'after') return { steps: [String(round.answer), 'Знайди в тексті те місце й прочитай, що йде одразу після нього.'] };
    return { steps: [String(round.answer).split(PLAN_SEP).map((x, i) => `${i + 1}. ${x}`).join('  '), 'Пункти плану йдуть так, як події в тексті: що було спочатку, що потім.'] };
  },
  generate,
  Component,
};

export default text4;
