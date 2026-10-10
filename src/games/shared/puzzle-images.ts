import type { CSSProperties } from 'react';

/**
 * Картинки для пазлів — повні сцени 600px webp (gen_shkolyaryk_puzzles.py, 10.10.2026).
 * Тло намальоване до країв: на 3×3 у кожному шматку є своя деталь. Герої на прозорому тлі
 * (zodiac_*) давали порожні сірі шматки, які не розрізнити, — з пазла прибрані, файли лишились.
 */
export const PUZZLE_IMAGES = [
  { src: '/puzzles/scene_bunny_garden.webp', name: 'Зайчик на городі' },
  { src: '/puzzles/scene_bear_picnic.webp', name: 'Ведмедик на пікніку' },
  { src: '/puzzles/scene_cat_room.webp', name: 'Котик з клубочком' },
  { src: '/puzzles/scene_pony_meadow.webp', name: 'Поні на галявині' },
  { src: '/puzzles/scene_train_town.webp', name: 'Паровозик' },
  { src: '/puzzles/scene_dragon_castle.webp', name: 'Дракончик біля замку' },
  { src: '/puzzles/scene_hedgehog_forest.webp', name: 'Їжачок у лісі' },
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
