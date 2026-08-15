import { describe, expect, it } from 'vitest';

import { isStudioHostname, studioPath, studioUrl } from './studioRoutes';

describe('Studio routes', () => {
  it('uses clean root paths on the Studio subdomain', () => {
    expect(isStudioHostname('studio.syverro.com')).toBe(true);
    expect(studioPath('', 'studio.syverro.com')).toBe('/');
    expect(studioPath('/users', 'studio.syverro.com')).toBe('/users');
  });

  it('preserves legacy paths away from the Studio subdomain', () => {
    expect(studioPath('users', 'syverro.com')).toBe('/studio/users');
    expect(studioUrl('users')).toBe('https://studio.syverro.com/users');
  });
});
