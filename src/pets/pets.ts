import { useProfileStore } from '@/stores/useProfileStore';

/**
 * Друг-звірятко (концепція 10.10.2026, vault `Школярик/01_Discovery/Companion_Concept_2026-10-10.md`).
 * Механіка догляду одна на всіх; різниця між звірятами — лише ці дані. Новий звір = новий рядок.
 * id збігається з avatar_id профілю (вибір на вході).
 */
export interface Pet {
  id: string;
  name: string;
  /** Знахідний відмінок: «Навчи зайчика / конячку». */
  acc: string;
  /** Легка картинка (600px webp) — для кутка гри, фінішу, головної. */
  img: string;
  /** Повна ілюстрація 1024px — коли звір великий на екрані. */
  full: string;
  /** Тло картки звіра. */
  color: string;
  food: string[];
  /** Де любить, щоб гладили, і як реагує. */
  pet: string;
  sleeps: string;
  /** Улюблене місце на карті (id з places.ts). */
  place: string;
  trick: string;
}

export const PETS: Record<string, Pet> = {
  rabbit: { id: 'rabbit', name: 'Зайчик', acc: 'зайчика', img: '/puzzles/zodiac_rabbit_wood.webp', full: '/creatures/zodiac_rabbit_wood.png', color: '#E6F6E0',
    food: ['морквина', 'капуста'], pet: 'вушка — жмуриться', sleeps: 'у норці', place: 'island', trick: 'стрибає через пеньок' },
  dragon: { id: 'dragon', name: 'Дракончик', acc: 'дракончика', img: '/puzzles/zodiac_dragon_fire.webp', full: '/creatures/zodiac_dragon_fire.png', color: '#FFE3D6',
    food: ['перчик', 'яблуко'], pet: 'живіт — чхає іскорками', sleeps: 'на купі скарбів', place: 'cave', trick: 'пускає кільця диму' },
  tiger: { id: 'tiger', name: 'Тигреня', acc: 'тигреня', img: '/puzzles/zodiac_tiger_metal.webp', full: '/creatures/zodiac_tiger_metal.png', color: '#E3EEFF',
    food: ['рибка', 'молоко'], pet: 'спинка — муркоче', sleeps: 'у кошику', place: 'mountain', trick: 'ловить метелика' },
  horse: { id: 'horse', name: 'Конячка', acc: 'конячку', img: '/puzzles/zodiac_horse_water.webp', full: '/creatures/zodiac_horse_water.png', color: '#E0F2FF',
    food: ['яблуко', 'сіно'], pet: 'грива — тихо ірже', sleeps: 'у стайні', place: 'garden', trick: 'скаче галопом' },
  ox: { id: 'ox', name: 'Бичок', acc: 'бичка', img: '/puzzles/zodiac_ox_earth.webp', full: '/creatures/zodiac_ox_earth.png', color: '#F3EAD8',
    food: ['трава', 'конюшина'], pet: 'лоб — мукає', sleeps: 'на сіні', place: 'forest', trick: 'бодає мʼячик' },
  monkey: { id: 'monkey', name: 'Мавпочка', acc: 'мавпочку', img: '/puzzles/zodiac_monkey_fire.webp', full: '/creatures/zodiac_monkey_fire.png', color: '#FFEFD6',
    food: ['банан', 'горішки'], pet: 'щічки — сміється', sleeps: 'на гілці', place: 'meadow', trick: 'крутиться на хвості' },
};

export const DEFAULT_PET = 'rabbit';
export const petById = (id?: string | null): Pet => PETS[id ?? ''] ?? PETS[DEFAULT_PET];

/** Друг дитини, що зараз грає (за avatar_id активного профілю). */
export function usePet(): Pet {
  const avatar = useProfileStore((s) => s.activeProfile?.avatar_id);
  return petById(avatar);
}
