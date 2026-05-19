export type AgeGroupId = 'preschool' | 'grade1' | 'grade2' | 'grade3' | 'grade4';

export interface AgeGroup {
  id: AgeGroupId;
  name: string;
  focus: string;
  uiScale: number;
  fontScale: number;
}

export const AGE_GROUPS: AgeGroup[] = [
  {
    id: 'preschool',
    name: 'Дошкільнята',
    focus: 'Кольори, форми, рахунок 1-5, перші букви',
    uiScale: 1.3,
    fontScale: 1.3,
  },
  {
    id: 'grade1',
    name: '1 клас',
    focus: 'Рахунок до 10, склади, логіка, пам\'ять',
    uiScale: 1.15,
    fontScale: 1.15,
  },
  {
    id: 'grade2',
    name: '2 клас',
    focus: 'Рахунок до 20, читання, задачі',
    uiScale: 1.0,
    fontScale: 1.0,
  },
  {
    id: 'grade3',
    name: '3 клас',
    focus: 'Математика до 100, множення, судоку',
    uiScale: 0.95,
    fontScale: 0.95,
  },
  {
    id: 'grade4',
    name: '4 клас',
    focus: 'Розширена математика, задачі, письмо',
    uiScale: 0.9,
    fontScale: 0.9,
  },
];

export const getAgeGroupById = (id: AgeGroupId): AgeGroup | undefined =>
  AGE_GROUPS.find((g) => g.id === id);
