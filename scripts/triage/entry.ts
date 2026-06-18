// Triage entry: exercises every Math-island game's generateLevel +
// validateAnswer across difficulties and age groups, with NO device runtime.
// Catches the common "broken" classes: throws, empty task lists, malformed
// tasks, and (where the task carries `expected`) a correct answer that the
// game refuses to validate. Renderer crashes are out of scope here.
import clockTime from '../../src/games/clock-time';
import columnArithmetic from '../../src/games/column-arithmetic';
import countObjects from '../../src/games/count-objects';
import fractionsCompare from '../../src/games/fractions-compare';
import mathCompare from '../../src/games/math-compare';
import mathExpressions from '../../src/games/math-expressions';
import measures from '../../src/games/measures';
import moneyBasics from '../../src/games/money-basics';
import recognizeDigit from '../../src/games/recognize-digit';
import shapes from '../../src/games/shapes';
import timesFlashcards from '../../src/games/times-flashcards';
import timesTables from '../../src/games/times-tables';

const GAMES = [
  clockTime, columnArithmetic, countObjects, fractionsCompare, mathCompare,
  mathExpressions, measures, moneyBasics, recognizeDigit, shapes,
  timesFlashcards, timesTables,
];

const ROUNDS = 8; // generators are random — sample several rounds per combo

type Row = { id: string; runs: number; fails: string[] };
const rows: Row[] = [];

for (const game of GAMES) {
  const fails: string[] = [];
  let runs = 0;
  const ageGroups = game.availableFor?.length ? game.availableFor : [undefined];

  for (const ag of ageGroups) {
    for (const d of [1, 2, 3]) {
      for (let r = 0; r < ROUNDS; r++) {
        runs++;
        const where = `d${d}/${ag ?? 'any'}#${r}`;
        try {
          const lvl: any = game.generateLevel(d, ag as any);
          if (!lvl || !Array.isArray(lvl.tasks) || lvl.tasks.length === 0) {
            fails.push(`${where}: empty/invalid level`);
            continue;
          }
          for (const task of lvl.tasks) {
            if (!task || typeof task !== 'object' || task.payload === undefined) {
              fails.push(`${where}: malformed task`);
              break;
            }
            if (task.expected !== undefined) {
              const res = game.validateAnswer(task as any, task.expected as any);
              if (!res || res.correct !== true) {
                fails.push(`${where}: expected answer not accepted`);
                break;
              }
            }
          }
        } catch (e: any) {
          fails.push(`${where}: THROW ${e?.message ?? e}`);
        }
      }
    }
  }
  // de-dup fail messages to keep the report readable
  rows.push({ id: game.id, runs, fails: [...new Set(fails)] });
}

let bad = 0;
console.log('\n=== MATH TRIAGE ===');
for (const row of rows) {
  const ok = row.fails.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? '✅' : '❌'} ${row.id.padEnd(20)} runs=${row.runs}${ok ? '' : '  → ' + row.fails.slice(0, 4).join(' | ')}`);
}
console.log(`\n${rows.length - bad}/${rows.length} clean, ${bad} with issues`);
