import { describe, it, expect } from 'vitest';
import { ITEMS, TOPICS } from './data';
import { TOPICS_BY, explainSpelling, generate } from './generate';

describe('uk-spelling: дані', () => {
  it('правильне написання ніколи не збігається з хибним; слова унікальні', () => {
    for (const i of ITEMS) for (const w of i.wrong) expect(w).not.toBe(i.right);
    expect(new Set(ITEMS.map((i) => i.right)).size).toBe(ITEMS.length);
  });

  it('у кожній темі щонайменше 6 слів — вистачить на рівень', () => {
    for (const t of Object.keys(TOPICS)) expect(ITEMS.filter((i) => i.topic === t).length, t).toBeGreaterThanOrEqual(6);
  });

  it('для ненаголошених і дзвінких є перевірне слово', () => {
    for (const i of ITEMS.filter((x) => x.topic === 'unstressed' || x.topic === 'voiced-end')) expect(i.check, i.right).toBeTruthy();
  });
});

describe('uk-spelling: рівні', () => {
  it('2 клас не отримує тем 3 класу на «Легко» і «Середньо»', () => {
    for (const d of [1, 2] as const) {
      for (let k = 0; k < 20; k++) {
        for (const r of generate(d, 'L3', 'grade2').rounds) expect(TOPICS_BY.grade2[d]).toContain(r.payload.item.topic);
      }
    }
  });

  it('6 різних слів, правильне — серед варіантів, кілька тем на рівень', () => {
    for (const cl of ['grade2', 'grade3'] as const) {
      for (const d of [1, 2, 3] as const) {
        const { rounds } = generate(d, 'L3', cl);
        expect(rounds).toHaveLength(6);
        expect(new Set(rounds.map((r) => r.answer)).size).toBe(6);
        expect(new Set(rounds.map((r) => r.payload.item.topic)).size).toBeGreaterThan(1);
        for (const r of rounds) expect(r.payload.options).toContain(r.answer);
      }
    }
  });

  it('пояснення: правило теми і перевірка з наголосом', () => {
    const item = ITEMS.find((i) => i.right === 'село')!;
    const e = explainSpelling({ id: 'r', payload: { item, options: [] }, answer: 'село' });
    expect(e.steps.join(' ')).toContain('се́ла');
    expect(e.steps).toContain(TOPICS.unstressed.rule);
  });
});
