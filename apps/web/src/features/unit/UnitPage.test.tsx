import type { Dataset } from '@condoscope/shared';
import { formatTHB } from '@condoscope/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../../App';
import fallback from '../../data/fallback.json';

const data = fallback as unknown as Dataset;
const a1805 = data.units.find((u) => u.unit_number === 'A-1805' && u.building_id === 1)!;
const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('UnitPage', () => {
  it('shows the unit facts', async () => {
    at(`/unit/${a1805.id}`);
    expect(await screen.findByRole('heading', { level: 1, name: 'ห้อง A-1805' })).toBeInTheDocument();
    expect(screen.getByText(formatTHB(a1805.price))).toBeInTheDocument();
    expect(screen.getByText(a1805.direction)).toBeInTheDocument();
  });

  it('shows the price in serif and the facts without a box around them', async () => {
    at(`/unit/${a1805.id}`);
    expect(await screen.findByText(formatTHB(a1805.price))).toHaveClass('font-serif');
    expect(screen.getByText('ประเภท').closest('dl')).not.toHaveClass('rounded-lg');
  });

  it('switches the interior view when a floor-plan hotspot is clicked', async () => {
    at(`/unit/${a1805.id}`);
    const plan = await screen.findByRole('group', { name: 'แปลนห้อง' });
    const hotspot = within(plan).getByRole('button', { name: 'ดูภาพ ห้องนอน' });
    await userEvent.click(hotspot);
    expect(hotspot).toHaveAttribute('aria-pressed', 'true');
    expect(within(screen.getByRole('figure')).getByText('ห้องนอน')).toBeInTheDocument();
  });

  it('labels the interior image as AI-generated (spec section 5)', async () => {
    at(`/unit/${a1805.id}`);
    const figure = await screen.findByRole('figure');
    expect(within(figure).getByRole('img')).toBeInTheDocument();
    expect(within(figure).getByText('ภาพประกอบสร้างด้วย AI')).toBeInTheDocument();
  });

  it('links back to the explorer with the unit kept selected', async () => {
    at(`/unit/${a1805.id}`);
    const back = await screen.findByRole('link', { name: 'กลับไปเลือกห้อง' });
    expect(back.getAttribute('href')).toBe(`/explorer/1?unit=${a1805.id}`);
  });

  it('shows not-found for an unknown unit', async () => {
    at('/unit/999999');
    expect(await screen.findByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeInTheDocument();
  });
});
