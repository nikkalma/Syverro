import { describe, expect, it } from 'vitest';

import { evidencePresentation } from './AIReview';
import { getLocaleData } from '../../../locales';

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

  it('presents the global proposal queue as Author moderation', () => {
    expect(getLocaleData('en').admin.moderation.aiReview.aiTab).toBe('Authors');
    expect(getLocaleData('en').admin.authors.editor.sections.ai).toBe('Author proposals');
  });
});
