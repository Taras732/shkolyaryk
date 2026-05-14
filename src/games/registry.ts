import type { GameDefinition } from './types';
import type { AgeGroupId } from '../constants/ageGroups';
import tapTheDot from './tap-the-dot';
import countObjects from './count-objects';
import mathExpressions from './math-expressions';
import mathCompare from './math-compare';
import shapes from './shapes';
import lettersFind from './letters-find';
import lettersFindEn from './letters-find-en';
import emotionsRecognize from './emotions-recognize';
import memoryMatch from './memory-match';
import animalsHabitat from './animals-habitat';
import colorsFind from './colors-find';
import whatsChanged from './whats-changed';
import syllableBuild from './syllable-build';
import englishWordPicture from './english-word-picture';
import waterStates from './water-states';
import breathing from './breathing';
import recognizeDigit from './recognize-digit';
import memoryAssociations from './memory-associations';
import digitSpan from './digit-span';
import reverseSequence from './reverse-sequence';
import sortingGame from './sorting-game';
import numberPatterns from './number-patterns';
import lifeScenarios from './life-scenarios';
import timesTables from './times-tables';
import columnArithmetic from './column-arithmetic';
import fractionsCompare from './fractions-compare';
import clockTime from './clock-time';
import moneyBasics from './money-basics';
import sudoku from './sudoku';
import measures from './measures';
import magicSquare from './magic-square';
import timesFlashcards from './times-flashcards';
import uaSymbols from './ua-symbols';
import worldFlags from './world-flags';
import continentsOceans from './continents-oceans';
import plantGrow from './plant-grow';
import sinkFloat from './sink-float';
import heroEmotion from './hero-emotion';
import safetyBasic from './safety-basic';

const registry = new Map<string, GameDefinition<any, any>>();

export function registerGame(def: GameDefinition<any, any>) {
  if (registry.has(def.id)) {
    if (__DEV__) console.warn(`[gameRegistry] duplicate id: ${def.id}`);
  }
  registry.set(def.id, def);
}

export function getGame(id: string): GameDefinition<any, any> | undefined {
  return registry.get(id);
}

export function listGames(): GameDefinition<any, any>[] {
  return Array.from(registry.values());
}

export function listGamesByIsland(islandId: string): GameDefinition<any, any>[] {
  return listGames().filter((g) => g.islandId === islandId);
}

export function isGameAvailableForGroup(game: GameDefinition<any, any>, ageGroupId: AgeGroupId): boolean {
  return !game.availableFor || game.availableFor.includes(ageGroupId);
}

export function listGamesByIslandForGroup(islandId: string, ageGroupId: AgeGroupId): GameDefinition<any, any>[] {
  return listGamesByIsland(islandId).filter((g) => isGameAvailableForGroup(g, ageGroupId));
}

registerGame(tapTheDot);
registerGame(countObjects);
registerGame(mathExpressions);
registerGame(mathCompare);
registerGame(shapes);
registerGame(lettersFind);
registerGame(lettersFindEn);
registerGame(emotionsRecognize);
registerGame(memoryMatch);
registerGame(animalsHabitat);
registerGame(colorsFind);
registerGame(whatsChanged);
registerGame(syllableBuild);
registerGame(englishWordPicture);
registerGame(waterStates);
registerGame(breathing);
registerGame(recognizeDigit);
registerGame(memoryAssociations);
registerGame(digitSpan);
registerGame(reverseSequence);
registerGame(sortingGame);
registerGame(numberPatterns);
registerGame(lifeScenarios);
registerGame(timesTables);
registerGame(columnArithmetic);
registerGame(fractionsCompare);
registerGame(clockTime);
registerGame(moneyBasics);
registerGame(sudoku);
registerGame(measures);
registerGame(magicSquare);
registerGame(timesFlashcards);
registerGame(uaSymbols);
registerGame(worldFlags);
registerGame(continentsOceans);
registerGame(plantGrow);
registerGame(sinkFloat);
registerGame(heroEmotion);
registerGame(safetyBasic);
