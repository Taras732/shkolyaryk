import { useProfileStore } from '@/stores/useProfileStore';
import type { ClassLevel } from '@/games/types';

/** Тестова родина під склад сімʼї Тараса — для «Спробувати без реєстрації» і меню DEV. */
const FAMILY: [string, ClassLevel, '5-6' | '6-7' | '7-8', string][] = [
  ['Дарина', 'preschool', '5-6', 'rabbit'],
  ['Марія', 'grade1', '6-7', 'tiger'],
  ['Соломія', 'grade2', '7-8', 'dragon'],
  ['Емілія', 'grade3', '7-8', 'horse'],
];

/** Створює відсутніх дітей родини; наявних не чіпає. */
export async function ensureTestFamily() {
  const st = useProfileStore.getState();
  for (const [name, cl, age, av] of FAMILY) {
    if (!useProfileStore.getState().profiles.some((p) => p.nickname === name)) await st.createProfile(name, age, av, undefined, cl);
  }
}
