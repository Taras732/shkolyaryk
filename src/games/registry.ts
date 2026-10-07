import { classToProfileLevel } from './types';
import type { GameDefinition, ProfileLevel, ClassLevel, Subject } from './types';
import type { ChildProfile } from '@/stores/useProfileStore';

// --- Математика ---
import counting from './counting';
import addition from './addition';
import compare from './compare';
import mathExamples from './math-examples';
import timesTables from './times-tables';
import mathCompare from './math-compare';
import columnArithmetic from './column-arithmetic';
import fractionsCompare from './fractions-compare';
import clockTime from './clock-time';
import moneyBasics from './money-basics';
import recognizeDigit from './recognize-digit';
import measures from './measures';
import numberTiles from './number-tiles';
import wordProblems from './word-problems';
import perimeterArea from './perimeter-area';
import cubeNet from './cube-net';
import gears from './gears';
import commandMachine from './command-machine';
// --- Мова ---
import lettersFind from './letters-find';
import syllableBuild from './syllable-build';
import readingSpeed from './reading-speed';
import grammarParts from './grammar-parts';
import ukLetters from './uk-letters';
import ukSyllables from './uk-syllables';
// --- Англійська ---
import lettersFindEn from './letters-find-en';
import englishWordPicture from './english-word-picture';
import englishWords from './english-words';
// --- Наука ---
import colorsFind from './colors-find';
import shapes from './shapes';
import waterStates from './water-states';
import sinkFloat from './sink-float';
import animalsHabitat from './animals-habitat';
import plantGrow from './plant-grow';
import seasonsWeather from './seasons-weather';
// --- Логіка ---
import logicSequences from './logic-sequences';
import sortingGame from './sorting-game';
import sudoku from './sudoku';
import magicSquare from './magic-square';
// --- Пам'ять ---
import memoryPairs from './memory-pairs';
import whatsChanged from './whats-changed';
import digitSpan from './digit-span';
import reverseSequence from './reverse-sequence';
import memoryAssociations from './memory-associations';
// --- Світ ---
import worldFlags from './world-flags';
import continentsOceans from './continents-oceans';
import uaSymbols from './ua-symbols';
// --- Життя ---
import emotionsRecognize from './emotions-recognize';
import lifeScenarios from './life-scenarios';
import breathing from './breathing';
// --- Увага ---
import tapTheDot from './tap-the-dot';

export const GAMES: GameDefinition[] = [
  // Математика
  counting, addition, compare, mathExamples, timesTables, mathCompare,
  columnArithmetic, fractionsCompare, clockTime, moneyBasics, recognizeDigit, measures, numberTiles, wordProblems, perimeterArea, cubeNet,
  // Мова
  ukLetters, ukSyllables, lettersFind, syllableBuild, readingSpeed, grammarParts,
  // Англійська
  englishWords, lettersFindEn, englishWordPicture,
  // Наука
  colorsFind, shapes, waterStates, sinkFloat, animalsHabitat, plantGrow, seasonsWeather, gears,
  // Логіка
  logicSequences, sortingGame, sudoku, magicSquare, commandMachine,
  // Пам'ять
  memoryPairs, whatsChanged, digitSpan, reverseSequence, memoryAssociations,
  // Світ
  worldFlags, continentsOceans, uaSymbols,
  // Життя
  emotionsRecognize, lifeScenarios, breathing,
  // Увага
  tapTheDot,
];

const byId = new Map<string, GameDefinition>(GAMES.map((g) => [g.id, g]));

export function getGame(id: string): GameDefinition | undefined {
  return byId.get(id);
}

/**
 * Навчальний клас профілю (G1): явний `class_level`, якщо заданий (онбординг G5 /
 * діагностика G4), інакше — тимчасовий вивід із віку. Віку вистачає лише до 2 класу;
 * 3–4 клас вимагають явного class_level (тому онбординг вибору класу — обов'язковий крок G5).
 */
export function profileClass(profile: Pick<ChildProfile, 'age_group' | 'class_level'>): ClassLevel {
  if (profile.class_level) return profile.class_level;
  switch (profile.age_group) {
    case 'under_4':
    case '5-6':
      return 'preschool';
    case '6-7':
      return 'grade1';
    case '7-8':
      return 'grade2';
    default:
      return 'preschool';
  }
}

/** «Трек» гри (дошкільний/шкільний) — похідний від класу. Зворотна сумісність зі старими генераторами. */
export function profileLevel(profile: Pick<ChildProfile, 'age_group' | 'class_level'>): ProfileLevel {
  return classToProfileLevel(profileClass(profile));
}

/** Ігри, доступні для «треку» гри (ProfileLevel). Лишається для зворотної сумісності. */
export function gamesForLevel(level: ProfileLevel): GameDefinition[] {
  return GAMES.filter((g) => g.levels.includes(level));
}

/**
 * Явне звуження доступності гри за КЛАСОМ (G3). Ключ — game.id. Якщо гра тут є —
 * показуємо лише переліченим класам; інакше — fallback на levels-трек
 * (classToProfileLevel): дошкільні L0-ігри → preschool, шкільні L3-ігри → 1–4 клас.
 * Значення — за availableFor старої версії + логіка появи тем НУШ (множення/дроби —
 * з 2 класу; периметр/площа — з 2; географія/магічний квадрат — 3–4).
 */
const AVAILABLE_BY_CLASS: Record<string, ClassLevel[]> = {
  // старші математичні теми — не раніше відповідного класу НУШ
  'times-tables': ['grade2', 'grade3', 'grade4'],
  'fractions-compare': ['grade2', 'grade3', 'grade4'],
  'column-arithmetic': ['grade1', 'grade2', 'grade3', 'grade4'],
  'perimeter-area': ['grade2', 'grade3', 'grade4'],
  'magic-square': ['grade3', 'grade4'],
  // розгортки куба — просторова тема 3–4 класу
  'cube-net': ['grade3', 'grade4'],
  // пари «однакові / сума 10» — рахунок першого десятка; для 3–4 класу запросто (аудит 07.10)
  'number-tiles': ['grade1', 'grade2'],
  // мова/світ для старших
  'reading-speed': ['grade2', 'grade3', 'grade4'],
  'grammar-parts': ['grade2', 'grade3', 'grade4'],
  'continents-oceans': ['grade3', 'grade4'],
  'world-flags': ['grade2', 'grade3', 'grade4'],
  // переважно для найменших
  'seasons-weather': ['preschool', 'grade1', 'grade2'],
};

/** Ігри, доступні для навчального КЛАСУ дитини (G3). Явне звуження + fallback на трек. */
export function gamesForClass(classLevel: ClassLevel): GameDefinition[] {
  const track = classToProfileLevel(classLevel);
  return GAMES.filter((g) => {
    const allow = AVAILABLE_BY_CLASS[g.id];
    return allow ? allow.includes(classLevel) : g.levels.includes(track);
  });
}

export const SUBJECT_META: Record<Subject, { title: string; emoji: string }> = {
  math: { title: 'Математика', emoji: '🔢' },
  language: { title: 'Мова', emoji: '📖' },
  english: { title: 'Англійська', emoji: '📗' },
  science: { title: 'Наука', emoji: '🔬' },
  logic: { title: 'Логіка', emoji: '🧩' },
  memory: { title: "Пам'ять", emoji: '🧠' },
  world: { title: 'Світ', emoji: '🌍' },
  life: { title: 'Життя', emoji: '💛' },
  attention: { title: 'Увага', emoji: '🎯' },
};

export const SUBJECT_ORDER: Subject[] = [
  'math', 'language', 'english', 'science', 'logic', 'memory', 'world', 'life', 'attention',
];
