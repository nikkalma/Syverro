import { describe, expect, it } from 'vitest';
import { be, en, kk, ru, sr, uk } from './index';

describe('localized source review navigation', () => {
  it.each([en, ru, be, kk, sr, uk])('provides operator review wording', (locale) => {
    expect(locale.admin.authors.editor.sections.discovery).toBeTruthy();
    expect(locale.admin.authors.editor.sources.reviewSources).toBeTruthy();
    expect(locale.admin.authors.editor.sources.pendingReview(2)).toBeTruthy();
  });
});
