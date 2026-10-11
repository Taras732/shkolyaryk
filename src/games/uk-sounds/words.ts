/**
 * Слова для «Звуки в слові» (11.10.2026). Розписано вручну: лише однозначні випадки для 1 класу.
 * Цілі «голосний/приголосний» — без я, ю, є, ї (два звуки) і без ь (звука не має).
 * «Твердий/мʼякий» — приголосний перед і, я, ю, є, ь (мʼякий) або перед а, о, у, е, и (твердий);
 * без шиплячих і губних перед і (напівпомʼякшені — не для 1 класу).
 */

export interface VcItem {
  word: string;
  emoji: string;
  /** Індекс виділеної букви. */
  at: number;
}

export const VC_WORDS: VcItem[] = [
  { word: 'мама', emoji: '👩', at: 0 }, { word: 'мама', emoji: '👩', at: 1 },
  { word: 'рука', emoji: '✋', at: 2 }, { word: 'рука', emoji: '✋', at: 1 },
  { word: 'нога', emoji: '🦶', at: 3 }, { word: 'сова', emoji: '🦉', at: 0 },
  { word: 'вода', emoji: '💧', at: 1 }, { word: 'дуб', emoji: '🌳', at: 2 },
  { word: 'сир', emoji: '🧀', at: 1 }, { word: 'кит', emoji: '🐋', at: 1 },
  { word: 'кит', emoji: '🐋', at: 2 }, { word: 'ліс', emoji: '🌲', at: 1 },
  { word: 'ніс', emoji: '👃', at: 0 }, { word: 'зуб', emoji: '🦷', at: 1 },
  { word: 'риба', emoji: '🐟', at: 3 }, { word: 'риба', emoji: '🐟', at: 2 },
  { word: 'лимон', emoji: '🍋', at: 3 }, { word: 'банан', emoji: '🍌', at: 4 },
  { word: 'тато', emoji: '👨', at: 3 }, { word: 'жук', emoji: '🪲', at: 0 },
];

export interface HsItem {
  word: string;
  emoji: string;
  at: number;
  soft: boolean;
}

export const HS_WORDS: HsItem[] = [
  { word: 'лис', emoji: '🦊', at: 0, soft: false }, { word: 'ліс', emoji: '🌲', at: 0, soft: true },
  { word: 'кит', emoji: '🐋', at: 0, soft: false }, { word: 'кіт', emoji: '🐱', at: 0, soft: true },
  { word: 'дим', emoji: '💨', at: 0, soft: false }, { word: 'дім', emoji: '🏠', at: 0, soft: true },
  { word: 'сом', emoji: '🐟', at: 0, soft: false }, { word: 'сіно', emoji: '🌾', at: 0, soft: true },
  { word: 'нора', emoji: '🕳️', at: 0, soft: false }, { word: 'ніс', emoji: '👃', at: 0, soft: true },
  { word: 'рука', emoji: '✋', at: 0, soft: false }, { word: 'річка', emoji: '🏞️', at: 0, soft: true },
  { word: 'зуб', emoji: '🦷', at: 0, soft: false }, { word: 'зірка', emoji: '⭐', at: 0, soft: true },
  { word: 'лук', emoji: '🏹', at: 0, soft: false }, { word: 'люди', emoji: '👨‍👩‍👧', at: 0, soft: true },
  { word: 'кінь', emoji: '🐴', at: 2, soft: true }, { word: 'сіль', emoji: '🧂', at: 2, soft: true },
  { word: 'день', emoji: '☀️', at: 0, soft: false }, { word: 'тінь', emoji: '🌳', at: 0, soft: true },
];

export interface StressItem {
  word: string;
  emoji: string;
  syllables: string[];
  stress: number;
}

export const STRESS_WORDS: StressItem[] = [
  { word: 'рука', emoji: '✋', syllables: ['ру', 'ка'], stress: 1 },
  { word: 'нога', emoji: '🦶', syllables: ['но', 'га'], stress: 1 },
  { word: 'сова', emoji: '🦉', syllables: ['со', 'ва'], stress: 1 },
  { word: 'вода', emoji: '💧', syllables: ['во', 'да'], stress: 1 },
  { word: 'риба', emoji: '🐟', syllables: ['ри', 'ба'], stress: 0 },
  { word: 'груша', emoji: '🍐', syllables: ['гру', 'ша'], stress: 0 },
  { word: 'коза', emoji: '🐐', syllables: ['ко', 'за'], stress: 1 },
  { word: 'лимон', emoji: '🍋', syllables: ['ли', 'мон'], stress: 1 },
  { word: 'банан', emoji: '🍌', syllables: ['ба', 'нан'], stress: 1 },
  { word: 'жираф', emoji: '🦒', syllables: ['жи', 'раф'], stress: 1 },
  { word: 'морква', emoji: '🥕', syllables: ['мор', 'ква'], stress: 0 },
  { word: 'квітка', emoji: '🌷', syllables: ['квіт', 'ка'], stress: 0 },
  { word: 'собака', emoji: '🐶', syllables: ['со', 'ба', 'ка'], stress: 1 },
  { word: 'корова', emoji: '🐮', syllables: ['ко', 'ро', 'ва'], stress: 1 },
  { word: 'молоко', emoji: '🥛', syllables: ['мо', 'ло', 'ко'], stress: 2 },
  { word: 'яблуко', emoji: '🍎', syllables: ['я', 'блу', 'ко'], stress: 0 },
  { word: 'капуста', emoji: '🥬', syllables: ['ка', 'пус', 'та'], stress: 1 },
];

export const VOWELS = new Set(['а', 'о', 'у', 'е', 'и', 'і']);
export const wordKey = (w: string) => `w_${w}`;
