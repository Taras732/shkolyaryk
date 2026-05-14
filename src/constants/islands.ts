import { colors } from './theme';

export type IslandCategory = 'intellect' | 'mental';

export interface Island {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** Text color for contrast on island.color. Defaults to '#fff' if omitted. */
  textColor?: string;
  category: IslandCategory;
  description: string;
}

export const ISLANDS: Island[] = [
  { id: 'math', name: 'Математика', icon: '🔢', color: colors.islandMath, category: 'intellect', description: 'Рахунок, приклади, фігури' },
  { id: 'letters', name: 'Букви', icon: '📖', color: colors.islandLetters, category: 'intellect', description: 'Алфавіт, склади, слова' },
  { id: 'english', name: 'English', icon: '🇬🇧', color: colors.islandEnglish, category: 'intellect', description: 'ABC, перші слова' },
  { id: 'logic', name: 'Логіка', icon: '🧩', color: colors.islandLogic, category: 'intellect', description: 'Судоку, послідовності, лабіринт' },
  { id: 'memory', name: 'Пам\'ять', icon: '🧠', color: colors.islandMemory, textColor: '#1F1B3A', category: 'intellect', description: 'Пари, Simon Says' },
  { id: 'science', name: 'Наука', icon: '🔬', color: colors.islandScience, category: 'mental', description: 'Природа, фізика' },
  { id: 'emotions', name: 'Емоції', icon: '💚', color: colors.islandEmotions, category: 'mental', description: 'Почуття, дихання' },
  { id: 'creativity', name: 'Творчість', icon: '🎨', color: colors.islandCreativity, category: 'mental', description: 'Малювання, пазли' },
  { id: 'geography', name: 'Географія', icon: '🌍', color: colors.islandGeography, category: 'intellect', description: 'Україна, континенти, океани' },
];

export const getIslandById = (id: string): Island | undefined =>
  ISLANDS.find((i) => i.id === id);
