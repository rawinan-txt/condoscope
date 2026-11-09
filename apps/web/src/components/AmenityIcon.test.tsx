import { generate } from '@condoscope/shared';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AmenityIcon, { AMENITY_ICONS } from './AmenityIcon';

describe('AmenityIcon', () => {
  it('has a dedicated icon for every amenity in the dataset', () => {
    for (const a of generate().amenities) expect(Object.keys(AMENITY_ICONS), a.name).toContain(a.icon);
  });

  it('renders an svg for known and unknown names, hidden from screen readers', () => {
    for (const name of ['waves', 'no-such-icon']) {
      const { container, unmount } = render(<AmenityIcon name={name} />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      unmount();
    }
  });
});
