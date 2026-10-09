import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, randInt, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { digitParts, findDigitKey } from '../shared/spoken-names';

interface Payload {
  digit: number;
  /** Варіанти для ChoiceGrid (включно з правильною цифрою), вже перемішані. */
  options: number[];
}

const ROUNDS = 5;
const CANDIDATES = 3;

/** Наскільки далеко можуть бути відволікачі від правильної цифри (0-9). */
function spreadFor(d: Difficulty): number {
  return d === 1 ? 6 : d === 2 ? 3 : 1;
}

/** Відволікачі-цифри, обмежені діапазоном 0-9. */
function digitDecoys(correct: number, count: number, spread: number): number[] {
  const pool = new Set<number>([correct]);
  let guard = 0;
  while (pool.size < count && guard < 100) {
    const off = (Math.random() > 0.5 ? 1 : -1) * randInt(1, spread);
    const d = correct + off;
    if (d >= 0 && d <= 9 && d !== correct) pool.add(d);
    guard++;
  }
  let f = 0;
  while (pool.size < count && f <= 9) {
    if (f !== correct) pool.add(f);
    f++;
  }
  return shuffle(Array.from(pool));
}

function generate(difficulty: Difficulty): LevelData<Payload, number> {
  const spread = spreadFor(difficulty);
  const used = new Set<number>();
  const rounds: Round<Payload, number>[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    let digit = randInt(0, 9);
    let guard = 0;
    while (used.has(digit) && guard < 20) {
      digit = randInt(0, 9);
      guard++;
    }
    used.add(digit);
    rounds.push({
      id: `r${i}`,
      payload: { digit, options: digitDecoys(digit, CANDIDATES, spread) },
      answer: digit,
    });
  }
  return { difficulty, rounds };
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { digit, options } = round.payload;
  const choices = options.map((v) => ({ value: v }));
  return (
    <>
      {hasUkAudio(findDigitKey(digit)) ? (
        // цифра лише звучить: намальована, вона була б і серед варіантів — відповідь у завданні
        <PromptCard
          question="Знайди цифру"
          answerState={answerState}
          say={(again) => sayUkSeq(digitParts(digit, again))}
          sayKey={`${round.id}-${digit}`}
        />
      ) : (
        <PromptCard question="Яка це цифра?" answerState={answerState}>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px auto' }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 32,
                background: 'var(--c-primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 112,
                fontWeight: 900,
                color: 'var(--c-primary)',
                fontFamily: 'var(--font-round)',
              }}
            >
              {digit}
            </div>
          </div>
        </PromptCard>
      )}
      <ChoiceGrid
        options={choices}
        correct={digit}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={3}
      />
    </>
  );
}

const recognizeDigit: GameDefinition<Payload, number> = {
  id: 'recognize-digit',
  title: 'Яка цифра?',
  subject: 'math',
  levels: ['L0'],
  icon: '🔢',
  description: 'Послухай і знайди цифру.',
  accent: '#EEEBFF',
  // Немає seed-skill "розпізнавання цифр 0-9" повністю — гра покриває 0-9,
  // а digits-1-5 (L0) обмежено діапазоном 1-5; numeral-writing (L1) додається
  // на важчих рівнях як найближчий проксі для повного діапазону.
  skillIds: {
    1: ['math.count.l0.digits-1-5'],
    2: ['math.count.l0.digits-1-5', 'math.count.l1.numeral-writing'],
    3: ['math.count.l1.numeral-writing'],
  },
  generate,
  Component,
};

export default recognizeDigit;
