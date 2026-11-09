import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generate } from '../src/generate';
import { datasetToSql } from '../src/sql';

const out = fileURLToPath(new URL('../../../database/seeds/seed.sql', import.meta.url));
mkdirSync(fileURLToPath(new URL('../../../database/seeds/', import.meta.url)), { recursive: true });
writeFileSync(out, datasetToSql(generate()));
console.log(`wrote ${out}`);
