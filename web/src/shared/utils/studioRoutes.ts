export const STUDIO_ORIGIN = 'https://studio.syverro.com';

export const isStudioHostname = (hostname = window.location.hostname): boolean =>
  hostname === 'studio.syverro.com';

export const normalizeStudioPath = (path: string): string =>
  path.replace(/^\/(?:studio|admin)(?=\/|$)/, '') || '/';

export const studioPath = (path = '', hostname = window.location.hostname): string => {
  const suffix = path && path !== '/' ? `/${path.replace(/^\/+/, '')}` : '';
  return isStudioHostname(hostname) ? suffix || '/' : `/studio${suffix}`;
};

export const studioUrl = (path = ''): string =>
  `${STUDIO_ORIGIN}${studioPath(normalizeStudioPath(path), 'studio.syverro.com')}`;
