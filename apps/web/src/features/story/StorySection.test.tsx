import { buildExplorer, type Dataset, type ExplorerPayload } from '@condoscope/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fallback from '../../data/fallback.json';
import StorySection from './StorySection';
import { stillOpacities } from './stills';
import { countAt } from './timeline';
import Counter from './Counter';

const data = fallback as unknown as Dataset;
let payload: ExplorerPayload | null;
vi.mock('../../services/api', async (orig) => ({ ...(await orig<typeof import('../../services/api')>()), getExplorer: vi.fn(async () => ({ data: payload, source: 'live' })) }));

const project = data.projects[0];
const available = () => payload!.units.filter((u) => u.status === 'available').length;
const show = () => render(<MemoryRouter><StorySection project={project} /><button>after</button></MemoryRouter>);
const reduce = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));

beforeEach(() => { payload = buildExplorer(data, project.id); reduce(false); });
afterEach(() => vi.unstubAllGlobals());

describe('StorySection', () => {
  it('has a skip button as its first focusable element, and it moves focus past the section', async () => {
    show();
    const skip = await screen.findByRole('button', { name: 'ข้ามส่วนนี้' });
    const first = document.querySelector('section')!.querySelector('a[href], button, input, select, [tabindex="0"]');
    expect(first).toBe(skip);
    await userEvent.click(skip);
    expect(document.getElementById('story-end')).toHaveFocus();
  });

  it('keeps the text of every chapter in the page for screen readers, with the final count', async () => {
    show();
    const section = (await screen.findByRole('button', { name: 'ข้ามส่วนนี้' })).closest('section')!;
    for (const t of [/เห็นตึกก่อน/, /หมุนรอบ/, /สว่างขึ้นทีละชั้น/, /เลือกห้องที่ใช่/]) expect(within(section).getByText(t)).toBeInTheDocument();
    expect(within(section).getByText(`ตอนนี้มี ${available()} ห้องว่าง`)).toBeInTheDocument();
  });

  it('links to the explorer with a chosen available unit', async () => {
    show();
    const link = await screen.findByRole('link', { name: 'เข้าสำรวจตึกนี้' });
    const m = link.getAttribute('href')!.match(/^\/explorer\/(\d+)\?unit=(\d+)$/);
    expect(m).not.toBeNull();
    expect(payload!.units.find((u) => u.id === Number(m![2]))!.status).toBe('available');
  });

  it('with reduced motion: no stage, no scroll track, the final number and the link at once', async () => {
    reduce(true);
    show();
    expect(await screen.findByRole('link', { name: 'เข้าสำรวจตึกนี้' })).toBeInTheDocument();
    expect(document.querySelector('.story-track, .story-stage')).toBeNull();
    expect(screen.getByTestId('story-count')).toHaveTextContent(String(available()));
  });

  it('renders nothing when no unit is available', async () => {
    payload = { ...payload!, units: payload!.units.map((u) => ({ ...u, status: 'sold' as const })) };
    show();
    await screen.findByText('after');
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole('button', { name: 'ข้ามส่วนนี้' })).toBeNull();
  });

  it('never draws a canvas in the stills tier', async () => {
    show();
    await screen.findByRole('button', { name: 'ข้ามส่วนนี้' });
    expect(document.querySelector('canvas')).toBeNull();
  });
});

describe('Counter', () => {
  it('shows the number to the eye and the total to a screen reader (no announcing every step)', () => {
    render(<Counter value={7} total={12} />);
    expect(screen.getByTestId('story-count')).toHaveTextContent('7');
    expect(screen.getByTestId('story-count')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('ห้องว่าง 12 ห้อง')).toBeInTheDocument();
    expect(document.querySelector('[aria-live]')).toBeNull();
  });
  it('matches the timeline when fed countAt', () => {
    render(<Counter value={countAt(1, 9)} total={9} />);
    expect(screen.getByTestId('story-count')).toHaveTextContent('9');
  });
});

describe('stillOpacities', () => {
  it('always sums to 1 (never an empty frame) and walks from the first still to the last', () => {
    for (let p = 0; p <= 1.0001; p += 0.01) expect(stillOpacities(p).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(stillOpacities(0)).toEqual([1, 0, 0, 0]);
    expect(stillOpacities(1)).toEqual([0, 0, 0, 1]);
    const mid = stillOpacities(0.45);
    expect(mid[1]).toBeGreaterThan(0); expect(mid[2]).toBeGreaterThan(0); expect(mid[0]).toBe(0); expect(mid[3]).toBe(0);
  });
});
