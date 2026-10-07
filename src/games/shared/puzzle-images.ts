import type { CSSProperties } from 'react';

/**
 * Картинки для пазлів — легкі копії (600px webp, 30–65 КБ) героїв із public/creatures
 * (оригінали по 1 МБ — задовго для телефона).
 */
export const PUZZLE_IMAGES = [
  { src: '/puzzles/zodiac_rabbit_wood.webp', name: 'Зайчик' },
  { src: '/puzzles/zodiac_monkey_fire.webp', name: 'Мавпочка' },
  { src: '/puzzles/zodiac_horse_water.webp', name: 'Конячка' },
  { src: '/puzzles/zodiac_ox_earth.webp', name: 'Бичок' },
  { src: '/puzzles/zodiac_tiger_metal.webp', name: 'Тигреня' },
  { src: '/puzzles/zodiac_dragon_fire.webp', name: 'Дракончик' },
  { src: '/puzzles/hero_dragon.webp', name: 'Дракон' },
];

/** Шматок картинки: фон із позицією клітинки (col, row) у сітці cols × rows. */
export function tileStyle(src: string, index: number, cols: number, rows: number): CSSProperties {
  const x = index % cols;
  const y = Math.floor(index / cols);
  return {
    backgroundImage: `url(${src})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${cols > 1 ? (x * 100) / (cols - 1) : 0}% ${rows > 1 ? (y * 100) / (rows - 1) : 0}%`,
  };
}
