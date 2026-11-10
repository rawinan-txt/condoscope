import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const dir = fileURLToPath(new URL('../../../.github/workflows/', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.yml'));
const load = (f: string) => ({ text: readFileSync(dir + f, 'utf8'), doc: parse(readFileSync(dir + f, 'utf8')) as any });

// majors checked on 2026-11-09 (plan 3)
const ACTION_MAJORS: Record<string, string> = {
  'actions/checkout': 'v7',
  'actions/setup-node': 'v7',
  'actions/configure-pages': 'v5',
  'actions/upload-pages-artifact': 'v4',
  'actions/deploy-pages': 'v4',
  'cloudflare/wrangler-action': 'v4',
};

describe('github workflows', () => {
  it('has the four workflows', () => {
    expect(files.sort()).toEqual(['ci.yml', 'deploy-api.yml', 'deploy-web.yml', 'seed-db.yml']);
  });

  for (const f of files) {
    describe(f, () => {
      const { text, doc } = load(f);

      it('declares permissions at workflow or job level', () => {
        const jobs = Object.values<any>(doc.jobs);
        expect(doc.permissions !== undefined || jobs.every((j) => j.permissions !== undefined)).toBe(true);
      });

      it('has no token-looking literal and takes Cloudflare values from secrets/vars', () => {
        expect(text).not.toMatch(/\b[A-Za-z0-9_-]{40,}\b/);
        for (const m of text.matchAll(/^\s*(CLOUDFLARE_\w+|apiToken|accountId)\s*:\s*(.+)$/gm)) {
          expect(m[2], m[1]).toMatch(/^\$\{\{\s*(secrets|vars)\.\w+\s*\}\}$/);
        }
      });

      it('pins every action to the agreed major version', () => {
        for (const m of text.matchAll(/uses:\s*([\w.-]+\/[\w.-]+)@(\S+)/g)) {
          expect(ACTION_MAJORS[m[1]], `unknown action ${m[1]}`).toBeDefined();
          expect(m[2], m[1]).toBe(ACTION_MAJORS[m[1]]);
        }
      });
    });
  }

  it('deploy-web can publish to Pages', () => {
    const { text } = load('deploy-web.yml');
    expect(text).toMatch(/pages:\s*write/);
    expect(text).toMatch(/id-token:\s*write/);
  });

  it('seed-db only runs by hand and needs the word SEED', () => {
    const { doc, text } = load('seed-db.yml');
    expect(Object.keys(doc.on)).toEqual(['workflow_dispatch']);
    expect(doc.on.workflow_dispatch.inputs.confirm).toBeDefined();
    expect(text).toMatch(/inputs\.confirm\s*==\s*'SEED'/);
  });

  it('seed-db and deploy-api share one concurrency group so remote D1 jobs never overlap or double up', () => {
    const seed = load('seed-db.yml').doc.concurrency;
    const deploy = load('deploy-api.yml').doc.concurrency;
    expect(seed.group).toBe('d1-remote');
    expect(deploy.group).toBe('d1-remote');
    expect(seed['cancel-in-progress']).toBe(false);
    expect(deploy['cancel-in-progress']).toBe(false);
  });

  it('.gitignore keeps env files (where a token could be put) out of git but keeps .env.example', () => {
    const ignore = readFileSync(fileURLToPath(new URL('../../../.gitignore', import.meta.url)), 'utf8').split(/\r?\n/);
    for (const line of ['.env', '.env.*', '!.env.example', '*.local', '.dev.vars']) expect(ignore, line).toContain(line);
  });

  it('ci runs e2e only on main pushes or by hand', () => {
    const { doc } = load('ci.yml');
    expect(doc.jobs.e2e.if).toMatch(/refs\/heads\/main/);
  });
});
