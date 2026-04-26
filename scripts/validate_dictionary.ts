import { DICTIONARY } from '../src/data/dictionary/index.js';

function validateDictionary() {
  console.log('Starting dictionary validation...');
  console.log(`Total entries: ${DICTIONARY.length}`);

  const words = new Set<string>();
  const duplicates = new Set<string>();
  
  const fields = ['id', 'word', 'category', 'meaning', 'hindiMeaning', 'exampleSentence', 'synonyms', 'antonyms', 'difficulty', 'examFrequency', 'etymology', 'pronunciation'];
  let errors = 0;
  let warnings = 0;

  for (const entry of DICTIONARY as any[]) {
    // 1. Check Duplicates
    const w = entry.word.toLowerCase();
    if (words.has(w)) {
      duplicates.add(w);
      console.error(`❌ ERROR: Duplicate word found: "${entry.word}"`);
      errors++;
    }
    words.add(w);

    // 2. Check Missing Fields
    for (const f of fields) {
      if (entry[f] === undefined || entry[f] === null || entry[f] === '') {
        console.error(`❌ ERROR: Entry "${entry.word}" is missing field "${f}"`);
        errors++;
      }
    }

    // 3. Warnings for Suspicious Data
    
    // Check for fake masks in synonyms
    if (entry.synonyms && entry.synonyms.some((s: string) => ['similar', 'opposite', 'same', 'different'].includes(s.toLowerCase()))) {
       console.error(`❌ ERROR: Fake mask found in synonyms for "${entry.word}"`);
       errors++;
    }
    
    // Check for fake masks in antonyms
    if (entry.antonyms && entry.antonyms.some((a: string) => ['similar', 'opposite', 'same', 'different'].includes(a.toLowerCase()))) {
       console.error(`❌ ERROR: Fake mask found in antonyms for "${entry.word}"`);
       errors++;
    }

    // Short example sentence (under 5 words usually implies it's too brief)
    if (entry.exampleSentence && entry.exampleSentence.split(' ').length < 5) {
      console.warn(`⚠️ WARNING: Very short example sentence for "${entry.word}": "${entry.exampleSentence}"`);
      warnings++;
    }

    // Hindi translation just being English characters 
    // Basic check: Does it have Devanagari characters? [\u0900-\u097F]
    if (entry.hindiMeaning && !/[\u0900-\u097F]/.test(entry.hindiMeaning)) {
      if (entry.hindiMeaning.toLowerCase() !== "placeholder") { // exclude the placeholders we backfilled
        console.warn(`⚠️ WARNING: Hindi translation for "${entry.word}" may not contain actual Hindi/Devanagari text: "${entry.hindiMeaning}"`);
        warnings++;
      }
    }
  }

  console.log(`\nValidation Summary:`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);

  if (errors > 0) {
    console.error(`\nValidation failed due to ${errors} errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Dictionary validation passed successfully.`);
  }
}

validateDictionary();
