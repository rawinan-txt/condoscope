import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ThreeBoundary from './ThreeBoundary';

function Boom(): never { throw new Error('chunk failed to load'); }

describe('ThreeBoundary', () => {
  it('reports the failure and renders the fallback instead of blanking the page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs caught errors
    const onError = vi.fn();
    render(<ThreeBoundary onError={onError} fallback={<p>ภาพตึก 2D</p>}><Boom /></ThreeBoundary>);
    expect(screen.getByText('ภาพตึก 2D')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledOnce();
  });
});
