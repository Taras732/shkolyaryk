import { useEffect } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { speak } from '../english-words/speech';

/**
 * «Що просять зробити?» — словник інструкцій з англійських підручників
 * (Listen and point, Match, Circle…). Один на всі підручники: вивчив раз —
 * розумієш завдання на будь-якій сторінці. Інструкція лише ЗВУЧИТЬ: у тексті
 * завдання її немає, інакше дитина шукала б збіг літер, а не розуміла.
 */
export interface Instruction {
  en: string;
  ua: string;
  emoji: string;
  /** 1 — найчастіші (1–2 клас), 2 — частіші, 3 — решта. */
  tier: 1 | 2 | 3;
}

export const INSTRUCTIONS: Instruction[] = [
  { en: 'Listen', ua: 'Послухай', emoji: '👂', tier: 1 },
  { en: 'Look', ua: 'Подивись', emoji: '👀', tier: 1 },
  { en: 'Point', ua: 'Покажи пальцем', emoji: '👉', tier: 1 },
  { en: 'Listen and repeat', ua: 'Послухай і повтори', emoji: '🔁', tier: 1 },
  { en: 'Say', ua: 'Скажи', emoji: '🗣️', tier: 1 },
  { en: 'Sing', ua: 'Заспівай', emoji: '🎵', tier: 1 },
  { en: 'Colour', ua: 'Розфарбуй', emoji: '🎨', tier: 1 },
  { en: 'Draw', ua: 'Намалюй', emoji: '🖍️', tier: 1 },
  { en: 'Circle', ua: 'Обведи в кружечок', emoji: '⭕', tier: 1 },
  { en: 'Match', ua: "З'єднай", emoji: '🔗', tier: 1 },
  { en: 'Count', ua: 'Порахуй', emoji: '🧮', tier: 1 },
  { en: 'Play', ua: 'Пограй', emoji: '🎲', tier: 1 },
  { en: 'Read', ua: 'Прочитай', emoji: '📖', tier: 2 },
  { en: 'Write', ua: 'Напиши', emoji: '✍️', tier: 2 },
  { en: 'Tick', ua: 'Постав галочку', emoji: '✔️', tier: 2 },
  { en: 'Cross out', ua: 'Закресли', emoji: '❌', tier: 2 },
  { en: 'Number', ua: 'Пронумеруй', emoji: '🔢', tier: 2 },
  { en: 'Find', ua: 'Знайди', emoji: '🔍', tier: 2 },
  { en: 'Choose', ua: 'Обери', emoji: '☝️', tier: 2 },
  { en: 'Trace', ua: 'Обведи по пунктиру', emoji: '✏️', tier: 2 },
  { en: 'Stick', ua: 'Наклей', emoji: '🏷️', tier: 2 },
  { en: 'Cut out', ua: 'Виріж', emoji: '✂️', tier: 2 },
  { en: 'Chant', ua: 'Промовляй у ритмі', emoji: '👏', tier: 2 },
  { en: 'Look and say', ua: 'Подивись і скажи', emoji: '💬', tier: 2 },
  { en: 'Complete', ua: 'Доповни', emoji: '🧩', tier: 3 },
  { en: 'Fill in the gaps', ua: 'Заповни пропуски', emoji: '⬜', tier: 3 },
  { en: 'Underline', ua: 'Підкресли', emoji: '〰️', tier: 3 },
  { en: 'Copy', ua: 'Перепиши', emoji: '📝', tier: 3 },
  { en: 'Ask and answer', ua: 'Запитай і дай відповідь', emoji: '🙋', tier: 3 },
  { en: 'Work in pairs', ua: 'Працюйте в парах', emoji: '👫', tier: 3 },
  { en: 'Act out', ua: 'Розіграйте сценку', emoji: '🎭', tier: 3 },
  { en: 'Guess', ua: 'Вгадай', emoji: '🤔', tier: 3 },
  { en: 'Answer the questions', ua: 'Дай відповідь на запитання', emoji: '❓', tier: 3 },
  { en: 'True or false', ua: 'Правда чи неправда', emoji: '✅', tier: 3 },
  { en: 'Put in order', ua: 'Розстав по порядку', emoji: '📶', tier: 3 },
  { en: 'Spell', ua: 'Назви по буквах', emoji: '🔤', tier: 3 },
  { en: 'Talk about', ua: 'Розкажи про', emoji: '🗨️', tier: 3 },
  { en: 'Read and match', ua: "Прочитай і з'єднай", emoji: '📚', tier: 3 },
  { en: 'Listen and number', ua: 'Послухай і пронумеруй', emoji: '🎧', tier: 3 },
  { en: 'Write the words', ua: 'Напиши слова', emoji: '🖊️', tier: 3 },
];

interface Payload {
  item: Instruction;
  options: string[];
}

const ROUNDS = 6;

function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const pool = INSTRUCTIONS.filter((i) => i.tier <= difficulty);
  const picked = shuffle(pool).slice(0, ROUNDS);
  const rounds: Round<Payload, string>[] = picked.map((item, i) => ({
    id: `r${i}`,
    payload: { item, options: shuffle([item.ua, ...shuffle(pool.filter((p) => p.ua !== item.ua)).slice(0, 2).map((p) => p.ua)]) },
    answer: item.ua,
  }));
  return { difficulty, rounds };
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { item, options } = round.payload;
  useEffect(() => { speak(item.en); }, [item.en]);
  const byUa = new Map(INSTRUCTIONS.map((i) => [i.ua, i]));
  return (
    <>
      <PromptCard question="Послухай: що просять зробити?" answerState={answerState}>
        <button
          type="button"
          onClick={() => speak(item.en)}
          aria-label="Послухати ще раз"
          style={{ display: 'block', margin: '8px auto', width: 120, height: 120, borderRadius: '50%', border: 0, background: 'var(--c-primary-soft)', fontSize: 56, cursor: 'pointer' }}
        >
          🔊
        </button>
        {/* англійський текст — лише ПІСЛЯ відповіді, щоб зв'язати звук і запис */}
        {answerState !== 'idle' && (
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 24, color: 'var(--c-primary)' }}>
            {item.emoji} {item.en}
          </div>
        )}
      </PromptCard>
      <ChoiceGrid
        options={options.map((ua) => ({ value: ua, node: <span>{byUa.get(ua)?.emoji} {ua}</span> }))}
        correct={item.ua}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={1}
      />
    </>
  );
}

const enInstructions: GameDefinition<Payload, string> = {
  id: 'en-instructions',
  title: 'Що просять зробити?',
  subject: 'english',
  levels: ['L3'],
  icon: '🎧',
  description: 'Розумій завдання з підручника англійської: Listen, Match, Circle…',
  accent: '#DDF3FF',
  generate,
  Component,
};

export default enInstructions;
