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
  'actions/upload-artifact': 'v7',
  'actions/deploy-pages': 'v4',
};
// receives the Cloudflare API token, so it is pinned to a commit (a moved tag could not swap the code under us)
const PINNED_BY_SHA = 'cloudflare/wrangler-action';

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
        // `uses:` lines hold public commit SHAs, not secrets
        expect(text.replace(/uses:.*/g, '')).not.toMatch(/\b[A-Za-z0-9_-]{40,}\b/);
        for (const m of text.matchAll(/^\s*(CLOUDFLARE_\w+|apiToken|accountId)\s*:\s*(.+)$/gm)) {
          expect(m[2], m[1]).toMatch(/^\$\{\{\s*(secrets|vars)\.\w+\s*\}\}$/);
        }
      });

      it('pins every action to the agreed major version', () => {
        for (const m of text.matchAll(/uses:\s*([\w.-]+\/[\w.-]+)@(\S+)(.*)/g)) {
          if (m[1] === PINNED_BY_SHA) continue; // checked in its own test below
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

  it('wrangler-action (it gets the Cloudflare token) is pinned to a full commit SHA with a version comment', () => {
    for (const f of ['deploy-api.yml', 'seed-db.yml']) {
      const uses = [...load(f).text.matchAll(/uses:\s*cloudflare\/wrangler-action@(\S+)(.*)/g)];
      expect(uses.length, f).toBeGreaterThan(0);
      for (const m of uses) {
        expect(m[1], f).toMatch(/^[0-9a-f]{40}$/);
        expect(m[2], f).toMatch(/#\s*v4\.\d+\.\d+/);
      }
    }
  });

  it('deploy-api and deploy-web run typecheck and tests before they deploy anything', () => {
    const order = (steps: any[], re: RegExp) => steps.findIndex((s) => re.test(`${s.run ?? ''} ${s.uses ?? ''}`));
    const api = load('deploy-api.yml').doc.jobs.deploy.steps;
    const firstDeploy = order(api, /wrangler-action/);
    for (const cmd of [/npm run typecheck/, /npm test/]) {
      const at = order(api, cmd);
      expect(at, `deploy-api ${cmd}`).toBeGreaterThan(-1);
      expect(at).toBeLessThan(firstDeploy);
    }
    const web = load('deploy-web.yml').doc.jobs.build.steps;
    const build = order(web, /npm run build -w web/);
    for (const cmd of [/npm run typecheck/, /npm test/]) {
      const at = order(web, cmd);
      expect(at, `deploy-web ${cmd}`).toBeGreaterThan(-1);
      expect(at).toBeLessThan(build);
    }
  });

  it('ci runs e2e on pull requests, on main and by hand, but not twice for a plain branch push', () => {
    const { doc } = load('ci.yml');
    const cond = String(doc.jobs.e2e.if);
    expect(cond).toBe("github.event_name != 'push' || github.ref == 'refs/heads/main'");
    // the same expression as the workflow evaluates it
    const runs = (event: string, ref: string) => event !== 'push' || ref === 'refs/heads/main';
    expect(runs('pull_request', 'refs/pull/5/merge')).toBe(true);
    expect(runs('workflow_dispatch', 'refs/heads/x')).toBe(true);
    expect(runs('push', 'refs/heads/main')).toBe(true);
    expect(runs('push', 'refs/heads/feat/x')).toBe(false);
  });
});
