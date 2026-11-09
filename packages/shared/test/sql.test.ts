import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { datasetToSql, generate, ROWS_PER_INSERT } from '../src';

const seedPath = fileURLToPath(new URL('../../../database/seeds/seed.sql', import.meta.url));
const lines = (sql: string) => sql.split('\n').filter((l) => l !== '');

describe('datasetToSql', () => {
  const d = generate();
  const sql = datasetToSql(d);

  it('escapes quotes, writes NULL, booleans as 1/0 and bays as a JSON string', () => {
    const odd = generate();
    odd.projects[0] = { ...odd.projects[0], name: "O'Neil Tower", thumbnail_url: null, is_featured: true };
    const out = datasetToSql(odd);
    expect(out).toContain("'O''Neil Tower'");
    expect(out).toMatch(/INSERT INTO projects \([^)]*\) VALUES \(1, 'noventa-ari', 'O''Neil Tower'.*, NULL, \d+, \d+, \d+, 1, '2026-03-01T00:00:00Z'\)/);
    expect(out).toContain("'[7,4,3.2,3.2,4,9.4]'");
  });

  it('refuses text with a line break (D1 exec splits statements on newlines)', () => {
    const bad = generate();
    bad.projects[0] = { ...bad.projects[0], description: 'two\nlines' };
    expect(() => datasetToSql(bad)).toThrow(/line break/);
  });

  it('is one statement per line, each ending with ; and under the 100 KB D1 limit', () => {
    for (const l of lines(sql)) {
      expect(l.endsWith(';')).toBe(true);
      expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(100_000);
    }
  });

  it('clears child tables first so the file can be run again', () => {
    expect(lines(sql).slice(0, 7)).toEqual([
      'DELETE FROM unit_type_images;', 'DELETE FROM project_amenities;', 'DELETE FROM amenities;', 'DELETE FROM units;',
      'DELETE FROM floors;', 'DELETE FROM buildings;', 'DELETE FROM projects;',
    ]);
  });

  it('chunks rows: units need ceil(n / ROWS_PER_INSERT) inserts', () => {
    const inserts = lines(sql).filter((l) => l.startsWith('INSERT INTO units '));
    expect(inserts).toHaveLength(Math.ceil(d.units.length / ROWS_PER_INSERT));
  });

  it('matches the committed database/seeds/seed.sql', () => {
    expect(readFileSync(seedPath, 'utf8')).toBe(sql);
  });
});
