// Editorial Intelligence — public barrel.
// Entity-agnostic architecture: presentational component + pure model + state helpers.
// Per-entity builders live alongside their workspaces and produce EditorialReport using this API.

export { default as EditorialIntelligence } from './EditorialIntelligence';
export * from './types';
export { deriveStatus, isEmpty, hasAny, summarize, group as buildGroup, STATUS_ORDER } from './editorialState';