import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../../App';

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('ExplorerPage', () => {
  it('shows not-found for an unknown project', async () => {
    at('/explorer/999999');
    expect(await screen.findByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeInTheDocument();
  });

  it('opens the details panel for a unit picked from the list', async () => {
    at('/explorer/1');
    await userEvent.click(within(await screen.findByRole('table')).getByRole('button', { name: /^ห้อง A-1805 / }));
    const panel = screen.getByRole('region', { name: 'รายละเอียดห้อง' });
    expect(within(panel).getByRole('heading', { name: 'ห้อง A-1805' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'ดูรายละเอียดห้อง' }).getAttribute('href')).toMatch(/\/unit\/\d+$/);
  });

  it('preselects the unit given in ?unit=', async () => {
    at('/explorer/1?unit=1');
    const panel = await screen.findByRole('region', { name: 'รายละเอียดห้อง' });
    expect(within(panel).getByRole('heading', { name: 'ห้อง A-701' })).toBeInTheDocument();
  });

  it('shows a legend with a text label for every status', async () => {
    at('/explorer/1');
    const legend = await screen.findByRole('list', { name: 'สถานะห้อง' });
    for (const label of ['ว่าง', 'จองแล้ว', 'ขายแล้ว', 'ไม่เปิดขาย', 'คุณจอง (Demo)']) expect(within(legend).getByText(label)).toBeInTheDocument();
  });
});
