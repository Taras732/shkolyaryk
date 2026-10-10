import { describe, expect, it } from 'vitest';
import { RIPE, care, emptyGarden, harvest, plant, waterLeft } from './garden';

const day = (n: number) => new Date(2026, 9, 10 + n, 10).getTime();

describe('garden', () => {
  it('grows one step per cared day, not per tap; ripe after 2 days; harvest goes to pantry', () => {
    let g = plant(emptyGarden(), 0, 'tomato');
    let r = care(g, 0, 'water', 0, day(0)); g = r.garden; expect(r.grew).toBe(false);
    r = care(g, 0, 'sun', 0, day(0)); g = r.garden; expect(r.grew).toBe(true); expect(g.pots[0].grown).toBe(1);
    // той самий день — не росте вдруге
    expect(care(g, 0, 'sun', 3, day(0)).ok).toBe(false);
    g = care(g, 0, 'water', 0, day(1)).garden;
    g = care(g, 0, 'sun', 0, day(1)).garden;
    expect(g.pots[0].grown).toBe(RIPE);
    g = harvest(g, 0);
    expect(g.pots[0].seed).toBeNull();
    expect(g.pantry).toEqual(['food_tomato']);
  });
  it('water: 1 a day plus one per plan step', () => {
    let g = plant(plant(emptyGarden(), 0, 'sunflower'), 1, 'sunflower');
    expect(waterLeft(g, 0, day(0))).toBe(1);
    g = care(g, 0, 'water', 0, day(0)).garden;
    expect(waterLeft(g, 0, day(0))).toBe(0);
    expect(care(g, 1, 'water', 0, day(0)).ok).toBe(false);
    expect(waterLeft(g, 2, day(0))).toBe(2);
    expect(waterLeft(g, 0, day(1))).toBe(1);
  });
});
