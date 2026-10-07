import { describe, it, expect, beforeEach } from 'vitest';
import { applyDoc, collectChanges, fingerprint } from './family-sync';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as any).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
  };
});

describe('family-sync', () => {
  it('новий пристрій: шле лише наявні блоки; після синхронізації — нічого', () => {
    mem.set('shk.tt.v2.k1', '{"6x7":1}');
    const first = collectChanges(['k1'], true, 100);
    expect(Object.keys(first.k1)).toEqual(['tables']);
    applyDoc({ profiles: [], states: first }, true);
    expect(collectChanges(['k1'], true, 200)).toEqual({});
  });

  it('змінений локально блок іде знову, з новим часом', () => {
    mem.set('shk.en.v1.k1', 'a');
    applyDoc({ profiles: [], states: collectChanges(['k1'], true, 100) }, true);
    mem.set('shk.en.v1.k1', 'b');
    expect(collectChanges(['k1'], true, 300).k1.words).toEqual({ data: 'b', at: 300 });
  });

  it('свіжіший з сервера блок записується локально; профілі з інших пристроїв додаються', () => {
    mem.set('shk_guest_profiles', JSON.stringify([{ id: 'k1', nickname: 'Емілія' }]));
    const changed = applyDoc(
      {
        profiles: [{ id: 'k1', nickname: 'Емілія' }, { id: 'k2', nickname: 'Соломія' }],
        states: { k2: { rewards: { data: '{"days":["2026-10-07"]}', at: 5 }, progress: { data: '{"times-tables":{"level":2}}', at: 5 } } },
      },
      true,
    );
    expect(changed).toBe(true);
    expect(JSON.parse(mem.get('shk_guest_profiles')!).map((p: any) => p.id)).toEqual(['k1', 'k2']);
    expect(mem.get('shk.rewards.v1.k2')).toBe('{"days":["2026-10-07"]}');
    expect(JSON.parse(mem.get('shk_guest_progress')!).k2).toEqual({ 'times-tables': { level: 2 } });
    expect(collectChanges(['k1', 'k2'], true, 9)).toEqual({});
  });

  it('відбиток розрізняє однакові за довжиною рядки', () => {
    expect(fingerprint('ab')).not.toBe(fingerprint('ba'));
  });
});
