import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from './App';

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('app shell', () => {
  it('shows the mock-data notice and the fallback banner on the home page', async () => {
    at('/');
    expect(screen.getByText(/ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง/)).toBeInTheDocument();
    expect(await screen.findByText('Demo Fallback Mode')).toBeInTheDocument();
    // once under "featured", once under "all projects"
    expect(await screen.findAllByRole('heading', { name: 'Noventa Ari' })).toHaveLength(2);
  });

  it('shows a not-found page for unknown routes', () => {
    at('/xyz');
    expect(screen.getByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'กลับหน้าแรก' })).toBeInTheDocument();
  });
});
