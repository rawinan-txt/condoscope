import type { ExplorerPayload } from '@condoscope/shared';
import { formatTHB } from '@condoscope/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { getExplorer } from '../../services/api';
import BuildingSvg from './BuildingSvg';
import { useExplorer, type ExplorerApi } from './useExplorer';

let payload: ExplorerPayload;
beforeAll(async () => { payload = (await getExplorer(1)).data; });

let api: ExplorerApi;
function Harness() {
  api = useExplorer(payload);
  return <BuildingSvg x={api} building={payload.buildings[0]} facade="front" />;
}
const unitRects = () => screen.getAllByRole('button', { name: /^ห้อง / });

describe('BuildingSvg', () => {
  it('draws one rect per front unit of tower A', () => {
    render(<Harness />);
    expect(unitRects()).toHaveLength(6 * 32);
  });

  it('shows a tooltip for the hovered unit and selects on click', () => {
    render(<Harness />);
    const u = payload.units.find((x) => x.unit_number === 'A-1805')!;
    const rect = screen.getByRole('button', { name: /^ห้อง A-1805 / });
    fireEvent.pointerEnter(rect);
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('A-1805');
    expect(tip).toHaveTextContent(formatTHB(u.price));
    fireEvent.click(rect);
    expect(api.selectedId).toBe(u.id);
  });

  it('hides floors above the cut floor', () => {
    render(<Harness />);
    act(() => api.setCutFloor({ building_id: 1, floor: 10 }));
    expect(screen.queryByRole('button', { name: /ชั้น 11 / })).toBeNull();
    expect(screen.getAllByRole('button', { name: /ชั้น 10 / })).toHaveLength(6);
  });
});
