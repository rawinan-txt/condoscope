import type { Dataset } from '@condoscope/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fallback from '../../data/fallback.json';
import * as api from '../../services/api';
import Counter from './Counter';
import StoryHero from './StoryHero';
import { stillOpacities } from './stills';
import { countAt } from './timeline';

const data = fallback as unknown as Dataset;
const projects = data.projects;
const free = data.units.filter((u) => u.status === 'available').length;
const show = () => render(<MemoryRouter><StoryHero projects={projects} /></MemoryRouter>);
const reduce = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));

beforeEach(() => reduce(false));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('StoryHero: the first screen', () => {
  it('is the search box with its heading, usable at once, and draws no canvas', () => {
    show();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const box = screen.getByRole('textbox', { name: 'ชื่อโครงการหรือทำเล' });
    expect(box.closest('[inert]')).toBeNull();
    expect(screen.getByRole('button', { name: 'ค้นหา' })).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('shows a still of the tower first, loaded with high priority', () => {
    show();
    const first = document.querySelector('.story-stage img[src*="still-1"]')!;
    expect(first.getAttribute('fetchpriority')).toBe('high');
    expect(first.getAttribute('src')).toContain('images/story/still-1.webp');
  });

  it('puts the skip button after the search box, and it moves focus past the story', async () => {
    show();
    const skip = screen.getByRole('button', { name: 'ข้ามส่วนนี้' });
    const search = screen.getByRole('button', { name: 'ค้นหา' });
    expect(search.compareDocumentPosition(skip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.click(skip);
    expect(document.getElementById('story-end')).toHaveFocus();
  });
});

describe('StoryHero: the story', () => {
  it('keeps every chapter in the page for screen readers', () => {
    show();
    const stage = document.querySelector('.story-stage')!;
    for (const t of ['ค้นหาและกรองได้ตามใจ', 'ดูทำเลบนแผนที่', 'เลือกห้องจากตัวตึก', 'ดูแปลนและภาพภายในห้อง', 'จองห้องแบบเดโม']) expect(within(stage as HTMLElement).getByRole('heading', { name: t })).toBeInTheDocument();
    expect(within(stage as HTMLElement).getByText(`${projects.length} โครงการ กรองตามทำเล ราคา และจำนวนห้องนอน`)).toBeInTheDocument();
  });

  it('tells whole-system numbers: the project count and the free rooms of all projects', async () => {
    show();
    expect(await screen.findByText(`ห้องว่างรวมทุกโครงการ ${free} ห้อง`)).toBeInTheDocument();
  });

  it('shows no free-room number when one project did not answer (a partial sum would be wrong)', async () => {
    const real = api.getProject;
    vi.spyOn(api, 'getProject').mockImplementation((id) => (id === projects[1].id ? Promise.reject(new Error('down')) : real(id)));
    show();
    await new Promise((r) => setTimeout(r, 700));
    expect(screen.queryByText(/ห้องว่างรวมทุกโครงการ/)).toBeNull();
  });

  it('ends with ways on: the search and a look at a tower', () => {
    show();
    expect(screen.getByRole('link', { name: 'เริ่มค้นหาคอนโด' })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: 'ลองดูตึก 3 มิติ' }).getAttribute('href')).toMatch(/^\/explorer\/\d+/);
  });

  it('has the living-room picture ready for the flight, marked as AI', () => {
    show();
    const room = screen.getByTestId('story-interior');
    expect(within(room).getByRole('img').getAttribute('src')).toContain('images/interiors/');
    expect(room).toHaveTextContent('ภาพประกอบสร้างด้วย AI');
  });
});

describe('StoryHero: reduced motion', () => {
  it('is a still hero with the search box, then plain content with the final numbers and no pinned stage', async () => {
    reduce(true);
    show();
    expect(screen.getByRole('textbox', { name: 'ชื่อโครงการหรือทำเล' })).toBeInTheDocument();
    expect(document.querySelector('.story-track, .story-stage')).toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
    const steps = screen.getByRole('region', { name: 'วิธีใช้งานเว็บนี้' });
    expect(within(steps).getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(await screen.findByTestId('story-count')).toHaveTextContent(String(free));
    expect(within(steps).getByRole('link', { name: 'เริ่มค้นหาคอนโด' })).toBeInTheDocument();
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
