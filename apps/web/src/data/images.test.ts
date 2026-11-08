// @vitest-environment node
import type { Dataset } from '@condoscope/shared';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import fallback from './fallback.json';

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url));

describe('interior images', () => {
  it('has a file in public/ for every unit_type_images row', () => {
    const missing = (fallback as unknown as Dataset).unit_type_images.map((i) => i.image_url).filter((u) => !existsSync(publicDir + u));
    expect(missing).toEqual([]);
  });
});
