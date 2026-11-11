import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import OverlayPanel from './OverlayPanel';

describe('OverlayPanel', () => {
  it('is a labelled region', () => {
    render(<OverlayPanel title="ตัวกรอง"><p>เนื้อหา</p></OverlayPanel>);
    expect(screen.getByRole('region', { name: 'ตัวกรอง' })).toBeInTheDocument();
    expect(screen.getByText('เนื้อหา')).toBeVisible();
  });

  it('collapses for real: content leaves the accessibility tree and the button says so', async () => {
    const user = userEvent.setup();
    render(<OverlayPanel title="ตัวกรอง" collapsible><p>เนื้อหา</p></OverlayPanel>);
    const btn = screen.getByRole('button', { name: /ตัวกรอง/ });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('เนื้อหา')).not.toBeVisible();
    expect(btn).toHaveAttribute('aria-controls', screen.getByText('เนื้อหา').parentElement!.id);
    await user.click(btn);
    expect(screen.getByText('เนื้อหา')).toBeVisible();
  });

  it('can start collapsed', () => {
    render(<OverlayPanel title="ตัวกรอง" collapsible defaultOpen={false}><p>เนื้อหา</p></OverlayPanel>);
    expect(screen.getByRole('button', { name: /ตัวกรอง/ })).toHaveAttribute('aria-expanded', 'false');
  });
});
