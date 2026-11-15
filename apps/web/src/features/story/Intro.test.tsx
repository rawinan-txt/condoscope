import type { Dataset } from '@condoscope/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import fallback from '../../data/fallback.json';
import { hasSeenIntro, INTRO_KEY } from '../../lib/intro';
import * as api from '../../services/api';
import Counter from './Counter';
import { stillOpacities } from './stills';
import { countAt } from './timeline';

const data = fallback as unknown as Dataset;
const projects = data.projects;
const free = data.units.filter((u) => u.status === 'available').length;
const visit = (path = '/') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
const reduce = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
const SEARCH = 'ชื่อโครงการหรือทำเล';
const skip = () => screen.findByRole('button', { name: /^ข้าม\s?การแนะนำ$/ });

beforeEach(() => { localStorage.removeItem(INTRO_KEY); reduce(false); }); // the shared setup makes every test a returning visitor

describe('the intro for a first visit', () => {
  it('is shown at "/" with no search box, and draws no canvas on a modest device', async () => {
    visit();
    expect(await screen.findByRole('heading', { level: 1, name: 'เลือกคอนโดผ่านตัวตึก 3 มิติ' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: SEARCH })).toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('puts the skip button first in the tab order, visible without being focused', async () => {
    visit();
    const button = await skip();
    expect(button).toBeVisible();
    expect(button.className).not.toMatch(/translate|sr-only|opacity-0/);
    await userEvent.tab();
    expect(button).toHaveFocus();
  });

  it('the first picture is the tower still, loaded with priority', async () => {
    visit();
    const first = await screen.findByRole('heading', { level: 1 });
    expect(first).toBeInTheDocument();
    const img = document.querySelector('img[src*="still-1"]')!;
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('keeps every chapter in the page for screen readers', async () => {
    visit();
    await screen.findByRole('heading', { level: 1 });
    const stage = document.querySelector('.story-stage') as HTMLElement;
    for (const t of ['ค้นหาและกรองได้ตามใจ', 'ดูทำเลบนแผนที่', 'เลือกห้องจากตัวตึก', 'ดูแปลนและภาพภายในห้อง', 'จองห้องแบบเดโม']) expect(within(stage).getByRole('heading', { name: t })).toBeInTheDocument();
  });

  it('tells whole-system numbers: the free rooms of all projects', async () => {
    visit();
    expect(await screen.findByText(`ห้องว่างรวมทุกโครงการ ${free} ห้อง`)).toBeInTheDocument();
  });

  it('shows no free-room number when one project did not answer (a partial sum would be wrong)', async () => {
    const real = api.getProject;
    vi.spyOn(api, 'getProject').mockImplementation((id) => (id === projects[1].id ? Promise.reject(new Error('down')) : real(id)));
    visit();
    await screen.findByRole('heading', { level: 1 });
    await new Promise((r) => setTimeout(r, 700));
    expect(screen.queryByText(/ห้องว่างรวมทุกโครงการ/)).toBeNull();
  });

  it('has the living-room picture ready for the flight, marked as AI', async () => {
    visit();
    const room = await screen.findByTestId('story-interior');
    expect(within(room).getByRole('img').getAttribute('src')).toContain('images/interiors/');
    expect(room).toHaveTextContent('ภาพประกอบสร้างด้วย AI');
  });
});

describe('leaving the intro', () => {
  it('skip shows the normal home page with the search box, and remembers it', async () => {
    visit();
    await userEvent.click(await skip());
    expect(await screen.findByRole('textbox', { name: SEARCH })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^ข้าม\s?การแนะนำ$/ })).toBeNull();
    expect(localStorage.getItem(INTRO_KEY)).toBe('seen');
  });

  it('the last chapter has "เริ่มหาคอนโด", which does the same', async () => {
    visit();
    await userEvent.click(await screen.findByRole('button', { name: 'เริ่มหาคอนโด' }));
    expect(await screen.findByRole('textbox', { name: SEARCH })).toBeInTheDocument();
    expect(hasSeenIntro()).toBe(true);
  });

  it('the next visit goes straight to the home page', async () => {
    localStorage.setItem(INTRO_KEY, 'seen');
    visit();
    expect(await screen.findByRole('textbox', { name: SEARCH })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^ข้าม\s?การแนะนำ$/ })).toBeNull();
  });

  it('with storage blocked the intro still shows, the skip button works and the intro does not come back in the visit', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    visit();
    await userEvent.click(await skip());
    expect(await screen.findByRole('textbox', { name: SEARCH })).toBeInTheDocument();
    expect(hasSeenIntro()).toBe(true);
  });
});

describe('only the home page has the intro', () => {
  it.each(['/search', '/project/1', '/explorer/1', '/unit/1', '/reservations'])('%s opens without it, even for a first-time visitor', async (path) => {
    visit(path);
    await screen.findByRole('main');
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('button', { name: /^ข้าม\s?การแนะนำ$/ })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'เลือกคอนโดผ่านตัวตึก 3 มิติ' })).toBeNull();
    expect(localStorage.getItem(INTRO_KEY)).toBeNull(); // visiting another page does not count as having seen it
  });
});

describe('seeing the intro again', () => {
  it('the footer has a link to it from every page', async () => {
    localStorage.setItem(INTRO_KEY, 'seen');
    visit('/search');
    expect(await screen.findByRole('link', { name: 'ดูแนะนำอีกครั้ง' })).toHaveAttribute('href', '/intro');
  });

  it('/intro shows it to a returning visitor, and finishing goes to the home page', async () => {
    localStorage.setItem(INTRO_KEY, 'seen');
    visit('/intro');
    await userEvent.click(await skip());
    expect(await screen.findByRole('textbox', { name: SEARCH })).toBeInTheDocument();
  });
});

describe('with reduced motion', () => {
  it('is still slides with final numbers, no stage and no 3D, and still ends in the start button', async () => {
    reduce(true);
    visit();
    const slides = await screen.findByRole('region', { name: 'แนะนำการใช้งานเว็บ' });
    expect(within(slides).getAllByRole('listitem')).toHaveLength(6);
    expect(document.querySelector('.story-track, .story-stage')).toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
    expect(await screen.findByTestId('story-count')).toHaveTextContent(String(free));
    expect(await skip()).toBeVisible();
    await userEvent.click(within(slides).getByRole('button', { name: 'เริ่มหาคอนโด' }));
    expect(await screen.findByRole('textbox', { name: SEARCH })).toBeInTheDocument();
  });
});

describe('Counter', () => {
  it('shows the number to the eye and the total to a screen reader (no announcing every step)', () => {
    render(<Counter value={7} total={12} label="ห้องว่างรวมทุกโครงการ" />);
    expect(screen.getByTestId('story-count')).toHaveTextContent('7');
    expect(screen.getByTestId('story-count')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('ห้องว่างรวมทุกโครงการ 12 ห้อง')).toBeInTheDocument();
    expect(document.querySelector('[aria-live]')).toBeNull();
  });
  it('matches the timeline when fed countAt', () => {
    render(<Counter value={countAt(1, 9)} total={9} label="x" />);
    expect(screen.getByTestId('story-count')).toHaveTextContent('9');
  });
});

describe('stillOpacities', () => {
  it('always sums to 1 (never an empty frame) and walks from the first still to the last', () => {
    for (let p = 0; p <= 1.0001; p += 0.01) expect(stillOpacities(p).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(stillOpacities(0)).toEqual([1, 0, 0, 0]);
    expect(stillOpacities(1)).toEqual([0, 0, 0, 1]);
  });
});
