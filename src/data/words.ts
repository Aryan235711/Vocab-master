/**
 * @file words.ts
 * @description Static dictionary definitions serving as the core linguistic source of truth.
 * Contains over 100 high-frequency words, idioms, phrasal verbs, and one-word substitutions tailored for SSC/UPSC.
 */

export type WordDifficulty = 'Easy' | 'Medium' | 'Hard';
export type WordCategory = 'Vocabulary' | 'Idioms' | 'Phrasal Verbs' | 'One-word Substitutions';

export interface WordData {
  id: string; // Unique string identifier prefixed with 'w'
  word: string; // The primary lexicographical entry
  meaning: string; // Core English definition
  hindiTranslation: string; // Localized Hindi context for target demograph
  exampleSentence: string; // Example usage in a sentence
  synonyms: string[]; // Array of similar meanings
  antonyms: string[]; // Array of opposite meanings
  etymology?: string; // Optional historical root text
  difficulty: WordDifficulty; // Baseline complexity scalar
  frequency: string; // Qualitative label for display ('Very High', 'High', 'Medium')
  examFrequency: Record<string, number>; // Per-exam raw frequency scores (SSC_CGL, UPSC, IBPS_PO, etc.)
  category: WordCategory; // Structural groupings for AI analytics
  aiMnemonic?: string; // Optional hardcoded memory hook fallback
}

/** Maps a user-facing exam target name to the dictionary's examFrequency key. */
export const EXAM_KEY_MAP: Record<string, string> = {
  'SSC CGL': 'SSC_CGL',
  'SSC CHSL': 'SSC_CGL', // CHSL shares CGL vocabulary pool
  'UPSC CSAT': 'UPSC',
  'IBPS PO': 'IBPS_PO',
  'SBI Clerk': 'IBPS_PO', // SBI Clerk shares banking vocabulary pool
};

/** Get the numeric frequency score for a word given the user's exam target. */
export function getExamFrequency(word: WordData, examTarget: string): number {
  const key = EXAM_KEY_MAP[examTarget] || 'SSC_CGL';
  return word.examFrequency[key] ?? 0;
}

/** Convert a numeric frequency score to a display label. */
export function frequencyLabel(score: number): string {
  if (score >= 8) return 'Very High';
  if (score >= 6) return 'High';
  return 'Medium';
}

// Old static fallback words
const FALLBACK_WORDS: WordData[] = [
  { id: 'w1', word: 'UBIQUITOUS', meaning: 'Present, appearing, or found everywhere.', hindiTranslation: 'सर्वव्यापी (Sarvavyapi)', exampleSentence: 'His ubiquitous influence was felt by all the family.', synonyms: ['omnipresent', 'everywhere', 'pervasive', 'universal'], antonyms: ['rare', 'scarce'], etymology: 'From Latin "ubique" meaning "everywhere".', difficulty: 'Medium', frequency: 'High', examFrequency: { SSC_CGL: 7, UPSC: 6, IBPS_PO: 5 }, category: 'Vocabulary', aiMnemonic: 'Like Amul butter or Parle-G biscuits in India, it is UBIQUITOUS (found everywhere).' },
  { id: 'w2', word: 'OBSEQUIOUS', meaning: 'Obedient or attentive to an excessive or servile degree.', hindiTranslation: 'चापलूसी करने वाला (Chaploosi karne wala)', exampleSentence: 'They were served by obsequious waiters.', synonyms: ['servile', 'ingratiating', 'sycophantic', 'fawning'], antonyms: ['domineering', 'arrogant', 'assertive'], etymology: 'From Latin "obsequium" (compliance).', difficulty: 'Hard', frequency: 'High', examFrequency: { SSC_CGL: 6, UPSC: 7, IBPS_PO: 4 }, category: 'Vocabulary', aiMnemonic: "Sounds like 'OB-SEQUE-US' - like a Bollywood sidekick obediently serving the boss (Ji Huzoor!)." },
  { id: 'w3', word: 'SYCOPHANT', meaning: 'A person who acts obsequiously toward someone important in order to gain advantage.', hindiTranslation: 'चापलूस (Chaploos)', exampleSentence: 'The minister was surrounded by sycophants.', synonyms: ['flatterer', 'yes-man', 'bootlicker'], antonyms: [], difficulty: 'Hard', frequency: 'Very High', examFrequency: { SSC_CGL: 9, UPSC: 8, IBPS_PO: 6 }, category: 'One-word Substitutions', aiMnemonic: "Psycho-pant: Imagine a crazy fan (psycho) panting behind a VIP to impress them." },
  { id: 'w4', word: 'CACOPHONY', meaning: 'A harsh, discordant mixture of sounds.', hindiTranslation: 'कोलाहल (Kolahal)', exampleSentence: 'A cacophony of deafening alarm bells.', synonyms: ['din', 'racket', 'clamor', 'discord'], antonyms: ['harmony', 'silence'], difficulty: 'Medium', frequency: 'High', examFrequency: { SSC_CGL: 7, UPSC: 6, IBPS_PO: 5 }, category: 'Vocabulary', aiMnemonic: "Caco (Kaka) + phony (phone): Kaka talking loudly on his phone in a crowded Indian train creates a CACOPHONY." },
  { id: 'w5', word: 'GARRULOUS', meaning: 'Excessively talkative, especially on trivial matters.', hindiTranslation: 'बातूनी (Batooni)', exampleSentence: 'Polonius is portrayed as a foolish, garrulous old man.', synonyms: ['talkative', 'loquacious', 'voluble', 'chatty'], antonyms: ['taciturn', 'reticent', 'concise'], difficulty: 'Hard', frequency: 'High', examFrequency: { SSC_CGL: 7, UPSC: 5, IBPS_PO: 4 }, category: 'Vocabulary', aiMnemonic: "Garrulo (sounds like girls): Stereotypically, a group of aunties gossiping endlessly at a kitty party are GARRULOUS." },
  { id: 'w6', word: 'PUGNACIOUS', meaning: 'Eager or quick to argue, quarrel, or fight.', hindiTranslation: 'झगड़ालू (Jhagadalu)', exampleSentence: 'The increasingly pugnacious demeanor of politicians.', synonyms: ['combative', 'aggressive', 'belligerent', 'truculent'], antonyms: ['peaceable', 'friendly'], difficulty: 'Hard', frequency: 'High', examFrequency: { SSC_CGL: 6, UPSC: 7, IBPS_PO: 5 }, category: 'Vocabulary', aiMnemonic: "Pug (the dog breed) + nacious: Keep teasing a pug and it becomes eager to bite and fight (PUGNACIOUS)." },
  { id: 'w7', word: 'INDOLENT', meaning: 'Wanting to avoid activity or exertion; lazy.', hindiTranslation: 'आलसी (Aalsi)', exampleSentence: 'They were indolent and addicted to a life of pleasure.', synonyms: ['lazy', 'idle', 'slothful', 'loafing'], antonyms: ['industrious', 'energetic'], difficulty: 'Medium', frequency: 'High', examFrequency: { SSC_CGL: 7, UPSC: 5, IBPS_PO: 6 }, category: 'Vocabulary', aiMnemonic: "Indo (Indoor) + lent (Rented): A person who stays indoor in their rented room all day doing nothing is INDOLENT." },
  { id: 'w8', word: 'CAPRICIOUS', meaning: 'Given to sudden and unaccountable changes of mood or behavior.', hindiTranslation: 'मनमौजी (Manmauji)', exampleSentence: 'A capricious and often brutal administration.', synonyms: ['fickle', 'inconstant', 'changeable', 'variable'], antonyms: ['stable', 'consistent'], difficulty: 'Hard', frequency: 'High', examFrequency: { SSC_CGL: 7, UPSC: 8, IBPS_PO: 5 }, category: 'Vocabulary', aiMnemonic: "Cup + prices: Remember how onion or tomato prices in India suddenly go up and down? They are CAPRICIOUS." },
  { id: 'w9', word: 'LACKADAISICAL', meaning: 'Lacking enthusiasm and determination; carelessly lazy.', hindiTranslation: 'उत्साहहीन (Utsaah-heen)', exampleSentence: 'A lackadaisical defense left the goalie exposed.', synonyms: ['lethargic', 'apathetic', 'sluggish', 'listless'], antonyms: ['enthusiastic', 'energetic'], difficulty: 'Medium', frequency: 'Medium', examFrequency: { SSC_CGL: 4, UPSC: 5, IBPS_PO: 3 }, category: 'Vocabulary', aiMnemonic: "Lack + a + dasi (maid): A household lacking a maid in India makes everyone work in a very lazy, unenthusiastic (LACKADAISICAL) way." },
  { id: 'w10', word: 'BELLIGERENT', meaning: 'Hostile and aggressive.', hindiTranslation: 'युद्धरत/लड़ाका (Yuddharat/Ladaka)', exampleSentence: 'A bull-necked, belligerent old man.', synonyms: ['hostile', 'aggressive', 'threatening', 'antagonistic'], antonyms: ['friendly', 'peaceable'], difficulty: 'Medium', frequency: 'High', examFrequency: { SSC_CGL: 6, UPSC: 7, IBPS_PO: 5 }, category: 'Vocabulary', aiMnemonic: "Belli (Billi = Cat) + gerent: A street cat cornered by dogs becomes highly aggressive and BELLIGERENT." },
  { id: 'w11', word: 'EPHEMERAL', meaning: 'Lasting for a very short time.', hindiTranslation: 'अल्पकालिक (Alpakalik)', exampleSentence: 'Fashions are ephemeral.', synonyms: ['transitory', 'transient', 'fleeting', 'passing', 'short-lived'], antonyms: ['long-lived', 'permanent'], etymology: 'From Greek "ephēmeros" (lasting a day).', difficulty: 'Medium', frequency: 'Medium', examFrequency: { SSC_CGL: 5, UPSC: 6, IBPS_PO: 4 }, category: 'Vocabulary', aiMnemonic: "E-fem-eral: Like Indian street food cravings, intense but lasting only for a short time." },
];

import type { DictEntry } from './dictionary/vocab_batch1';

function mapDictEntryToWordData(entry: DictEntry): WordData {
  let cat: WordCategory = 'Vocabulary';
  const c = entry.category as string;
  if (c === 'Idiom' || c === 'Idioms') cat = 'Idioms';
  else if (c === 'PhrasalVerb' || c === 'Phrasal Verbs') cat = 'Phrasal Verbs';
  else if (c === 'OneWordSub' || c === 'One-word Substitutions') cat = 'One-word Substitutions';

  // Preserve per-exam frequency data; default display label uses max across exams
  const examFreq = entry.examFrequency || {};
  const maxFreq = Math.max(...Object.values(examFreq), 0);

  return {
    id: entry.id,
    word: entry.word,
    meaning: entry.meaning,
    hindiTranslation: entry.hindiMeaning,
    exampleSentence: entry.exampleSentence,
    synonyms: entry.synonyms,
    antonyms: entry.antonyms,
    etymology: entry.etymology,
    difficulty: entry.difficulty as WordDifficulty,
    frequency: frequencyLabel(maxFreq),
    examFrequency: examFreq,
    category: cat,
    aiMnemonic: entry.pronunciation ? `Pronunciation: ${entry.pronunciation}` : undefined
  };
}

/** Fallback words load synchronously so the app renders instantly. */
export const INITIAL_WORDS: WordData[] = [...FALLBACK_WORDS];

/**
 * Loads the full dictionary. Strategy:
 * 1. Try fetching from the API server (zero bundle cost)
 * 2. Fall back to dynamic import (code-split chunk, for static builds without a server)
 */
export async function loadFullDictionary(): Promise<WordData[]> {
  try {
    const res = await fetch('/api/dictionary');
    if (res.ok) {
      const entries: DictEntry[] = await res.json();
      return [...FALLBACK_WORDS, ...entries.map(mapDictEntryToWordData)];
    }
  } catch {
    // API not available — fall through to dynamic import
  }

  // Fallback: dynamic import (Vite code-splits this into a separate chunk)
  const { DICTIONARY } = await import('./dictionary/index');
  return [
    ...FALLBACK_WORDS,
    ...DICTIONARY.map(mapDictEntryToWordData),
  ];
}
