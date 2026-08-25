const CORPUS_REASON_COPY: Record<string, string> = {
  NO_VERIFIED_SOURCES: 'No verified sources are available for this Author.',
  BIOGRAPHY_UNSUPPORTED: 'None of the verified sources contains usable biography evidence.',
  LITERARY_CONTEXT_UNSUPPORTED: 'None of the verified sources contains usable literary-context evidence.',
  TIMELINE_UNSUPPORTED: 'None of the verified sources contains usable timeline evidence.',
  BIBLIOGRAPHY_UNSUPPORTED: 'None of the verified sources contains usable bibliography evidence.',
  IDENTITY_UNSUPPORTED: 'None of the verified sources contains sufficient identity evidence.',
  INSUFFICIENT_CORPUS: 'The verified research corpus is insufficient for this Fill domain.',
};

export const UNKNOWN_CORPUS_REASON = 'This Fill domain is currently unavailable.';

export function corpusReasonCode(reason?: string | null): string | null {
  if (!reason) return null;
  const candidate = reason.includes(':') ? reason.split(':').at(-1) : reason;
  return candidate?.trim().toUpperCase() || null;
}

export function corpusReasonMessage(reason?: string | null): string {
  const code = corpusReasonCode(reason);
  return (code && CORPUS_REASON_COPY[code]) || UNKNOWN_CORPUS_REASON;
}
