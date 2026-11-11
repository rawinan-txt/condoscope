import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('layout', () => {
  it('the explorer page fills the screen below the header; the footer stays reachable under it', () => {
    at('/explorer/1');
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-full-bleed', 'true');
    // the screen-height block holds header + main, the footer (with the mock-data notice) comes after it
    const screen_ = main.closest('[data-screen]')!;
    expect(screen_).not.toBeNull();
    expect(screen_.contains(screen.getByRole('contentinfo'))).toBe(false);
    expect(screen.getByText(/ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง/)).toBeInTheDocument();
  });

  it('other pages keep the normal flow', () => {
    for (const path of ['/', '/search', '/map', '/xyz']) {
      const { unmount } = at(path);
      expect(screen.getByRole('main')).not.toHaveAttribute('data-full-bleed');
      unmount();
    }
  });
});
