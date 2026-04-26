import * as fs from 'fs';
import * as path from 'path';

const dictPath = path.join(process.cwd(), 'src', 'data', 'dictionary');
const files = fs.readdirSync(dictPath).filter(f => f.endsWith('.ts'));

const allIds = new Set<string>();
let totalWords = 0;
let errors = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(dictPath, file), 'utf-8');
  
  const idRegex = /['"]?id['"]?:\s*['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    if (id === 'string') continue; // Skip TS interface definitions
    
    if (allIds.has(id)) {
      console.error(`DUPLICATE ID FOUND: ${id} in ${file}`);
      errors++;
    }
    allIds.add(id);
    totalWords++;
  }
}

console.log(`\n--- FORENSIC AUDIT REPORT ---`);
console.log(`Total dictionary files scanned: ${files.length}`);
console.log(`Total unique IDs: ${allIds.size}`);
console.log(`Total valid node blocks parsed: ${totalWords}`);
console.log(`Audit Errors (Duplicate IDs): ${errors}`);

if (errors > 0) {
  process.exit(1);
}
