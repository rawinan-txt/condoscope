import { render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollProgress } from './useScrollProgress';

let rect = { top: 0, height: 1000 };
let frames: FrameRequestCallback[] = [];
const flush = () => { const f = frames; frames = []; f.forEach((cb) => cb(0)); };

function Probe({ onChange }: { onChange: (p: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(ref, onChange);
  return <div ref={ref} />;
}

beforeEach(() => {
  rect = { top: 0, height: 1000 };
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
  vi.stubGlobal('cancelAnimationFrame', () => { frames = []; });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ ...rect, bottom: rect.top + rect.height, left: 0, right: 0, width: 0, x: 0, y: rect.top, toJSON() {} }));
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(500);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('useScrollProgress', () => {
  it('reports the current progress once on mount (a page opened mid-story)', () => {
    rect = { top: -250, height: 1000 };
    const onChange = vi.fn();
    render(<Probe onChange={onChange} />);
    flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it('five scroll events in one frame report once', () => {
    const onChange = vi.fn();
    render(<Probe onChange={onChange} />);
    flush(); onChange.mockClear();
    rect = { top: -100, height: 1000 };
    for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('scroll'));
    flush();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not repeat an unchanged value', () => {
    const onChange = vi.fn();
    render(<Probe onChange={onChange} />);
    flush(); onChange.mockClear();
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('listens passively and removes the listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Probe onChange={() => {}} />);
    const call = add.mock.calls.find((c) => c[0] === 'scroll')!;
    expect(call[2]).toEqual({ passive: true });
    unmount();
    expect(remove.mock.calls.some((c) => c[0] === 'scroll' && c[1] === call[1])).toBe(true);
  });
});
