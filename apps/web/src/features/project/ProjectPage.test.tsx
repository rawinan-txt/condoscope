import { buildProjectDetail, formatMillion, generate, UNIT_TYPE_LABEL } from '@condoscope/shared';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { getProject } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const m = await importOriginal<typeof import('../../services/api')>();
  return { ...m, getProject: vi.fn(m.getProject) };
});

const d = generate();
const detail = buildProjectDetail(d, 1)!;
const open = (id: number | string = 1) => render(<MemoryRouter initialEntries={[`/project/${id}`]}><App /></MemoryRouter>);
const project = async () => screen.findByRole('heading', { level: 1, name: 'Noventa Ari' });

describe('ProjectPage', () => {
  it('shows name, location, price, amenities, buildings and description', async () => {
    open();
    await project();
    expect(screen.getByText(detail.project.address_display)).toBeInTheDocument();
    expect(screen.getByText(`เริ่มต้น ${formatMillion(detail.project.starting_price)}`)).toBeInTheDocument();
    const amenities = within(screen.getByRole('region', { name: 'สิ่งอำนวยความสะดวก' })).getAllByRole('listitem');
    expect(amenities.map((a) => a.textContent)).toEqual(detail.amenities.map((a) => a.name));
    const buildings = within(screen.getByRole('region', { name: 'ข้อมูลอาคาร' })).getAllByRole('listitem');
    expect(buildings).toHaveLength(2);
    expect(buildings[0]).toHaveTextContent('อาคาร A');
    expect(buildings[0]).toHaveTextContent('ชั้น 7–38');
    expect(screen.getByText(detail.project.description)).toBeInTheDocument();
  });

  it('lists the available units by type', async () => {
    open();
    await project();
    const table = screen.getByRole('table', { name: 'ห้องว่างแยกตามประเภท' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(detail.availability.length);
    detail.availability.forEach((a, i) => {
      expect(rows[i]).toHaveTextContent(UNIT_TYPE_LABEL[a.unit_type]);
      expect(rows[i]).toHaveTextContent(a.available > 0 ? `${a.available} ห้อง` : 'ไม่มีห้องว่าง');
    });
  });

  it('has a prominent button to the building explorer', async () => {
    open();
    await project();
    expect(screen.getByRole('link', { name: 'เลือกห้องจากตัวอาคาร' })).toHaveAttribute('href', '/explorer/1');
  });

  it('says "no units available" for a type with none, and the button still works', async () => {
    vi.mocked(getProject).mockResolvedValueOnce({
      source: 'live',
      data: { ...detail, availability: detail.availability.map((a, i) => (i === 0 ? { ...a, available: 0, min_price: null } : a)) },
    });
    open();
    await project();
    const first = within(screen.getByRole('table', { name: 'ห้องว่างแยกตามประเภท' })).getAllByRole('row')[1];
    expect(first).toHaveTextContent('ไม่มีห้องว่าง');
    expect(screen.getByRole('link', { name: 'เลือกห้องจากตัวอาคาร' })).toBeInTheDocument();
  });

  it('a project without an explorer shows a note instead of the button', async () => {
    vi.mocked(getProject).mockResolvedValueOnce({
      source: 'live',
      data: { ...detail, buildings: detail.buildings.map((b) => ({ ...b, has_explorer: false })) },
    });
    open();
    await project();
    expect(screen.queryByRole('link', { name: 'เลือกห้องจากตัวอาคาร' })).toBeNull();
    expect(screen.getByText('โครงการนี้ยังไม่เปิดให้เลือกห้องจากตัวอาคาร')).toBeInTheDocument();
  });

  it('an unknown project is "not found" with a way back', async () => {
    open(999999);
    expect(await screen.findByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'กลับหน้าแรก' })).toBeInTheDocument();
  });

  it('a project that cannot be loaded shows the retry state', async () => {
    vi.mocked(getProject).mockRejectedValueOnce(new Error('down'));
    open();
    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดข้อมูลไม่สำเร็จ');
  });
});

describe('Gallery on the project page', () => {
  it('starts with the project picture (no AI label) and moves to interior pictures that carry the AI label', async () => {
    open();
    await project();
    const gallery = screen.getByRole('region', { name: 'แกลเลอรีภาพโครงการ' });
    expect(within(gallery).getByRole('img', { name: 'ภาพโครงการ Noventa Ari' })).toBeInTheDocument();
    expect(within(gallery).queryByText('ภาพประกอบสร้างด้วย AI')).toBeNull();
    await userEvent.click(within(gallery).getAllByRole('button', { name: /^ดูภาพ: ห้องนั่งเล่น/ })[0]);
    expect(within(gallery).getByText('ภาพประกอบสร้างด้วย AI')).toBeInTheDocument();
  });

  it('works from the keyboard', async () => {
    open();
    await project();
    const gallery = screen.getByRole('region', { name: 'แกลเลอรีภาพโครงการ' });
    const thumb = within(gallery).getAllByRole('button', { name: /^ดูภาพ: ห้องนั่งเล่น/ })[0];
    thumb.focus();
    await userEvent.keyboard('{Enter}');
    expect(thumb).toHaveAttribute('aria-pressed', 'true');
  });

  it('drops a picture that fails to load instead of showing a broken image', async () => {
    const { container } = open();
    await project();
    const gallery = screen.getByRole('region', { name: 'แกลเลอรีภาพโครงการ' });
    const before = within(gallery).getAllByRole('button').length;
    fireEvent.error(container.querySelectorAll('section[aria-label="แกลเลอรีภาพโครงการ"] button img')[1]);
    expect(within(gallery).getAllByRole('button')).toHaveLength(before - 1);
  });
});
