import { describe, expect, it } from 'vitest';
import { corpusReasonMessage, UNKNOWN_CORPUS_REASON } from './corpusReason';

describe('corpus unavailable reason copy', () => {
  it.each([
    ['NO_VERIFIED_SOURCES', 'No verified sources are available for this Author.'],
    ['BIOGRAPHY_UNSUPPORTED', 'None of the verified sources contains usable biography evidence.'],
    ['LITERARY_CONTEXT_UNSUPPORTED', 'None of the verified sources contains usable literary-context evidence.'],
    ['TIMELINE_UNSUPPORTED', 'None of the verified sources contains usable timeline evidence.'],
    ['BIBLIOGRAPHY_UNSUPPORTED', 'None of the verified sources contains usable bibliography evidence.'],
    ['IDENTITY_UNSUPPORTED', 'None of the verified sources contains sufficient identity evidence.'],
    ['INSUFFICIENT_CORPUS', 'The verified research corpus is insufficient for this Fill domain.'],
  ])('maps %s consistently', (code, copy) => expect(corpusReasonMessage(code)).toBe(copy));

  it('fails closed with editorial copy for unknown codes', () => {
    expect(corpusReasonMessage('FUTURE_UNKNOWN_CODE')).toBe(UNKNOWN_CORPUS_REASON);
  });
});
