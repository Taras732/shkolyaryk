import { useEffect } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { CAPS, COUNT, FILL, KINDS, MARKS, fullText, wordCount, type Mark } from './data';

/**
 * «Речення» (11.10.2026) — 1 клас, програма Савченко [1 МОВ 4.1]:
 *  d1 — скільки слів у реченні (2–4; «у», «в», «до» теж слова);
 *  d2 — доповни речення словом за змістом; після правильної відповіді речення звучить повністю;
 *  d3 — який знак у кінці: речення звучить з інтонацією, дитина ставить . ? або !
 * Фраза завдання — раз на гру (r0).
 */

type Payload =
  | { mode: 'count'; id: string; text: string; emoji: string; options: number[] }
  | { mode: 'fill'; id: string; text: string; full: string; emoji: string; options: string[] }
  | { mode: 'mark'; id: string; text: string; full: string }
  | { mode: 'kind'; text: string; options: string[] }
  | { mode: 'caps'; rule: string; options: string[] };
type Answer = number | string;


export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let rounds: Round<Payload, Answer>[];
  if (difficulty === 1) {
    // 4 «скільки слів» + 2 «слово чи речення?»
    const count: Omit<Round<Payload, Answer>, 'id'>[] = shuffle(COUNT).slice(0, 4).map((c) => ({
      payload: { mode: 'count', id: c.id, text: c.text, emoji: c.emoji, options: [2, 3, 4] }, answer: wordCount(c.text),
    }));
    const kinds = [shuffle(KINDS.filter((k) => k.kind === 'слово'))[0], shuffle(KINDS.filter((k) => k.kind === 'речення'))[0]];
    const kind: Omit<Round<Payload, Answer>, 'id'>[] = kinds.map((k) => ({ payload: { mode: 'kind', text: k.text, options: ['слово', 'речення'] }, answer: k.kind }));
    rounds = shuffle([...count, ...kind]).map((r, i) => ({ ...r, id: `r${i}` }));
  } else if (difficulty === 2) {
    // 4 «доповни речення» + 2 «як правильно написати?» (велика буква)
    const fill: Omit<Round<Payload, Answer>, 'id'>[] = shuffle(FILL).slice(0, 4).map((f) => ({
      payload: { mode: 'fill', id: f.id, text: f.text, full: fullText.fill(f), emoji: f.emoji, options: shuffle([f.answer, ...f.wrong]) }, answer: f.answer,
    }));
    const caps: Omit<Round<Payload, Answer>, 'id'>[] = shuffle(CAPS).slice(0, 2).map((c) => ({
      payload: { mode: 'caps', rule: c.rule, options: shuffle([c.right, ...c.wrong]) }, answer: c.right,
    }));
    rounds = shuffle([...fill, ...caps]).map((r, i) => ({ ...r, id: `r${i}` }));
  } else {
    // по два кожного знака — щоб не вгадувалось «завжди крапка»
    const by = (m: Mark) => shuffle(MARKS.filter((x) => x.mark === m)).slice(0, 2);
    rounds = shuffle([...by('.'), ...by('?'), ...by('!')]).map((m, i) => ({
      id: `r${i}`, payload: { mode: 'mark', id: m.id, text: m.text, full: fullText.mark(m) }, answer: m.mark,
    }));
  }
  return { difficulty, rounds };
}

const PHRASES = {
  kind: { key: 'p_sen_kind', text: 'Це слово чи речення?' },
  caps: { key: 'p_sen_caps', text: 'Як правильно написати?' },
  count: { key: 'p_sen_count', text: 'Скільки слів у реченні?' },
  fill: { key: 'p_sen_fill', text: 'Доповни речення.' },
  mark: { key: 'p_sen_mark', text: 'Який знак у кінці?' },
} as const;

const MARK_NAMES: Record<Mark, string> = { '.': 'крапка', '?': 'знак питання', '!': 'знак оклику' };

const SENTENCE = { fontSize: 30, fontWeight: 800, textAlign: 'center' as const, lineHeight: 1.35, fontFamily: 'var(--font-round)' };

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  if (p.mode === 'kind' || p.mode === 'caps') {
    // читання очима: озвучуємо лише питання (голос підказав би відповідь)
    const sayQ = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={sayQ} sayKey={round.id}>
          {p.mode === 'kind' && <div style={SENTENCE}>{p.text}</div>}
        </PromptCard>
        <ChoiceGrid options={p.options.map((o) => ({ value: o, node: p.mode === 'caps' ? <span style={{ fontSize: 17, fontWeight: 800 }}>{o}</span> : undefined }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'caps' ? 1 : 2} />
      </>
    );
  }
  const sentence = { key: `sen_${p.id}`, text: p.mode === 'count' ? p.text : p.full };
  const first = round.id === 'r0';

  // d2: речення з пропуском не озвучуємо (відповідь прозвучала б) — лише фразу; повне — після правильної
  const say = p.mode === 'fill'
    ? (hasUkAudio(phrase.key) ? (again?: boolean) => (first || again ? sayUkSeq([phrase]) : undefined) : undefined)
    : (hasUkAudio(sentence.key) ? (again?: boolean) => sayUkSeq(again || !first ? [sentence] : [phrase, sentence]) : undefined);

  useEffect(() => {
    if (p.mode === 'fill' && answerState === 'correct' && hasUkAudio(sentence.key)) sayUkSeq([sentence]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerState]);

  if (p.mode === 'count') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ fontSize: 48, textAlign: 'center' }}>{p.emoji}</div>
          <div style={SENTENCE}>{p.text}</div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  if (p.mode === 'fill') {
    const [before, after] = p.text.split('___');
    const shown = answerState === 'correct' ? String(round.answer) : '';
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ fontSize: 48, textAlign: 'center' }}>{p.emoji}</div>
          <div style={SENTENCE}>
            {before}
            <span style={{ display: 'inline-block', minWidth: 90, borderBottom: '4px solid var(--c-primary)', color: '#16A34A' }}>{shown}</span>
            {after}
          </div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((w) => ({ value: w }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        <div style={SENTENCE}>
          {p.text}
          <span style={{ display: 'inline-block', minWidth: 30, marginLeft: 4, borderBottom: '4px solid var(--c-primary)', color: '#16A34A' }}>{answerState === 'correct' ? round.answer : ''}</span>
        </div>
      </PromptCard>
      <ChoiceGrid
        options={(['.', '?', '!'] as Mark[]).map((m) => ({ value: m, node: (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{m}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-mut)' }}>{MARK_NAMES[m]}</span>
          </span>
        ) }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
    </>
  );
}

const ukSentences: GameDefinition<Payload, Answer> = {
  id: 'uk-sentences',
  title: 'Речення',
  subject: 'language',
  levels: ['L3'],
  icon: '✏️',
  description: 'Скільки слів у реченні, доповни речення, який знак у кінці.',
  accent: '#E0F2FE',
  skillsFor: (d) => (d === 1 ? ['language.text.l1.words-in-sentence', 'language.word.l1.word-vs-sentence']
    : d === 2 ? ['language.text.l1.simple-sentence', 'language.orth.l1.capital-sentence-start', 'language.orth.l1.capital-names']
    : ['language.orth.l1.end-punctuation']),
  // 11.10: «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'count') {
      const words = p.text.replace(/[.,!?]/g, '').split(' ');
      const small = words.some((w) => w.length <= 2);
      return { steps: [words.join(' | '), `Слів: ${words.length}.`], why: small ? 'Маленькі слова «у», «в», «до» — теж слова.' : undefined };
    }
    if (p.mode === 'fill') return { steps: [p.full, 'Інші слова не підходять за змістом.'] };
    if (p.mode === 'kind') return round.answer === 'речення'
      ? { steps: ['Тут закінчена думка: велика буква на початку, знак у кінці.', 'Це речення.'] }
      : { steps: ['Тут лише одна назва — думки ще немає.', 'Це слово.'] };
    if (p.mode === 'caps') return { steps: [String(round.answer), p.rule] };
    const m = round.answer as Mark;
    return m === '?' ? { steps: ['Ми питаємо — ставимо знак питання.', 'Голос у кінці підіймається.'] }
      : m === '!' ? { steps: ['Сильне почуття — радість, страх, заклик — знак оклику.', 'Кажемо голосно, з почуттям.'] }
      : { steps: ['Ми спокійно розповідаємо — ставимо крапку.', 'Голос у кінці знижується.'] };
  },
  generate,
  Component,
};

export default ukSentences;
