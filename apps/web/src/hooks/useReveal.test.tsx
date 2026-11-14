import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReveal } from './useReveal';

function Box() {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} data-testid="box" className="reveal" />;
}

let cb: (e: { isIntersecting: boolean }[]) => void = () => {};
const disconnect = vi.fn();
const observe = vi.fn();
const stubObserver = () =>
  vi.stubGlobal('IntersectionObserver', class { constructor(c: typeof cb) { cb = c; } observe = observe; disconnect = disconnect; });
const stubMotion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('useReveal', () => {
  it('waits for the element to enter the screen, then reveals once and stops watching', () => {
    stubObserver(); stubMotion(false);
    const { getByTestId } = render(<Box />);
    expect(getByTestId('box')).not.toHaveAttribute('data-revealed');
    cb([{ isIntersecting: false }]);
    expect(getByTestId('box')).not.toHaveAttribute('data-revealed');
    cb([{ isIntersecting: true }]);
    expect(getByTestId('box')).toHaveAttribute('data-revealed', 'true');
    expect(disconnect).toHaveBeenCalled();
  });

  it('shows the content at once when IntersectionObserver does not exist', () => {
    vi.stubGlobal('IntersectionObserver', undefined); stubMotion(false);
    expect(render(<Box />).getByTestId('box')).toHaveAttribute('data-revealed', 'true');
  });

  it('shows the content at once, without an observer, when reduced motion is requested', () => {
    stubObserver(); stubMotion(true);
    expect(render(<Box />).getByTestId('box')).toHaveAttribute('data-revealed', 'true');
    expect(observe).not.toHaveBeenCalled();
  });
});
