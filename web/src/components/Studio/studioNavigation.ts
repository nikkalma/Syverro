import type { LocaleData } from '../../locales';

export type StudioModuleKey = keyof LocaleData['admin']['nav'];

export const ACTIVE_STUDIO_MODULES = [
  'dashboard',
  'users',
  'books',
  'authors',
  'moderation',
  'logs',
  'settings',
] as const satisfies readonly StudioModuleKey[];

export const ACTIVE_STUDIO_LAUNCHER_MODULES = [
  'users',
  'books',
  'authors',
  'moderation',
  'logs',
  'settings',
] as const satisfies readonly StudioModuleKey[];

export const PARKED_STUDIO_PATHS = [
  'genres',
  'taxonomy',
  'entities',
  'metadata',
] as const;
