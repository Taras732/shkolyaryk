import { useProfileStore } from '@/stores/useProfileStore';
import { usePetChoice } from './state';

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
  /** Своя їжа: картинка з public/count і назва. */
  food: { img: string; name: string }[];
  /** Де любить, щоб гладили, і як реагує. */
  pet: string;
  sleeps: string;
  /** Улюблене місце на карті (id з places.ts). */
  place: string;
  trick: string;
  /** Де ковдрочка накриває звіра в кошику (частка висоти ілюстрації): визирає лише верх — вушка, ріжки, гребінь. */
  peek: number;
  /** Що каже на дотик — своє в кожного; озвучка pet_<id>_<ключ> (gen-uk-audio.py читає цей файл). */
  say: { hi: string; head: string; belly: string; nose: string };
  /** Обличчя на ілюстрації `full` (1024×1024): очі [cx, cy, rx, ry, колір повіки], рот [x, y, колір шкіри навколо]. */
  face?: { eyes: [number, number, number, number, string][]; mouth: [number, number, string] };
}

export const PETS: Record<string, Pet> = {
  rabbit: { id: 'rabbit', name: 'Зайчик', acc: 'зайчика', img: '/puzzles/zodiac_rabbit_wood.webp', full: '/creatures/zodiac_rabbit_wood.png', color: '#E6F6E0',
    food: [{ img: 'carrot', name: 'морквина' }, { img: 'food_cabbage', name: 'капуста' }], pet: 'вушка — жмуриться', sleeps: 'у норці', place: 'island', trick: 'стрибає через пеньок', peek: 0.43,
    say: { hi: 'Привіт! Я Зайчик!', head: 'Як приємно!', belly: 'Хі-хі, лоскотно!', nose: 'Апчхи!' } },
  dragon: { id: 'dragon', name: 'Дракончик', acc: 'дракончика', img: '/puzzles/zodiac_dragon_fire.webp', full: '/creatures/zodiac_dragon_fire.png', color: '#FFE3D6',
    food: [{ img: 'food_pepper', name: 'перчик' }, { img: 'apple', name: 'яблуко' }], pet: 'живіт — чхає іскорками', sleeps: 'на купі скарбів', place: 'cave', trick: 'пускає кільця диму', peek: 0.37,
    say: { hi: 'Привіт! Я Дракончик!', head: 'Мрр, як тепло!', belly: 'Хі-хі! Аж іскорки летять!', nose: 'Апчхи! Пф-ф-ф!' },
    face: { eyes: [[349, 440, 34, 48, '#F36C30'], [567, 437, 58, 60, '#F07A3A']], mouth: [507, 531, '#FBBA5D'] } },
  tiger: { id: 'tiger', name: 'Тигреня', acc: 'тигреня', img: '/puzzles/zodiac_tiger_metal.webp', full: '/creatures/zodiac_tiger_metal.png', color: '#E3EEFF',
    food: [{ img: 'food_fish', name: 'рибка' }, { img: 'as_milk', name: 'молоко' }], pet: 'спинка — муркоче', sleeps: 'у кошику', place: 'mountain', trick: 'ловить метелика', peek: 0.42,
    say: { hi: 'Привіт! Я Тигреня!', head: 'Мур-мур-мур…', belly: 'Хі-хі, лоскотно!', nose: 'Пчхи!' },
    face: { eyes: [[400, 487, 54, 54, '#D6F1FD'], [640, 487, 54, 54, '#E7FAFD']], mouth: [513, 587, '#BEEDFB'] } },
  horse: { id: 'horse', name: 'Конячка', acc: 'конячку', img: '/puzzles/zodiac_horse_water.webp', full: '/creatures/zodiac_horse_water.png', color: '#E0F2FF',
    food: [{ img: 'apple', name: 'яблуко' }, { img: 'food_hay', name: 'сіно' }], pet: 'грива — тихо ірже', sleeps: 'у стайні', place: 'garden', trick: 'скаче галопом', peek: 0.31,
    say: { hi: 'Привіт! Я Конячка!', head: 'І-го-го, як приємно!', belly: 'Хі-хі, лоскотно!', nose: 'Фр-р-р!' },
    face: { eyes: [[357, 349, 20, 32, '#F4F6FD'], [509, 380, 40, 44, '#F4F6FD']], mouth: [413, 493, '#E6E1DF'] } },
  ox: { id: 'ox', name: 'Бичок', acc: 'бичка', img: '/puzzles/zodiac_ox_earth.webp', full: '/creatures/zodiac_ox_earth.png', color: '#F3EAD8',
    food: [{ img: 'food_grass', name: 'трава' }, { img: 'food_clover', name: 'конюшина' }], pet: 'лоб — мукає', sleeps: 'на сіні', place: 'forest', trick: 'бодає мʼячик', peek: 0.41,
    say: { hi: 'Привіт! Я Бичок!', head: 'Му-у, приємно!', belly: 'Хі-хі, лоскотно!', nose: 'Апчхи!' },
    face: { eyes: [[411, 473, 44, 49, '#F89F5D'], [613, 473, 44, 49, '#F89F60']], mouth: [513, 587, '#D2AD8B'] } },
  monkey: { id: 'monkey', name: 'Мавпочка', acc: 'мавпочку', img: '/puzzles/zodiac_monkey_fire.webp', full: '/creatures/zodiac_monkey_fire.png', color: '#FFEFD6',
    food: [{ img: 'food_banana', name: 'банан' }, { img: 'food_nuts', name: 'горішки' }], pet: 'щічки — сміється', sleeps: 'на гілці', place: 'meadow', trick: 'крутиться на хвості', peek: 0.43,
    say: { hi: 'Привіт! Я Мавпочка!', head: 'У-у-а-а! Ще, ще!', belly: 'Ха-ха-ха!', nose: 'Апчхи!' },
    face: { eyes: [[427, 464, 47, 49, '#FCE6BE'], [587, 451, 47, 49, '#FCE6BE']], mouth: [517, 547, '#FEE7BD'] } },
};

export const DEFAULT_PET = 'rabbit';
export const petById = (id?: string | null): Pet => PETS[id ?? ''] ?? PETS[DEFAULT_PET];

/** Друг дитини, що зараз грає: обраний нею в кошику; поки не обрала — зайчик (лише для кутка гри). */
export function usePet(): Pet {
  const id = useProfileStore((s) => s.activeProfile?.id);
  return petById(usePetChoice(id).petId);
}
