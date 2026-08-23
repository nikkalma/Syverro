import { describe, expect, it } from 'vitest';

import { evidencePresentation } from './AIReview';

describe('moderation evidence state presentation', () => {
  it.each([
    ['direct_grounded', 'DIRECT GROUNDED'],
    ['partial', 'PARTIAL'],
    ['synthetic', 'SYNTHETIC'],
    ['ungrounded', 'UNGROUNDED'],
  ])('distinguishes %s', (state, label) => {
    expect(evidencePresentation(state).label).toBe(label);
  });

  it('never styles an unknown state as grounded', () => {
    expect(evidencePresentation('legacy').label).toBe('UNVERIFIED');
  });
});
