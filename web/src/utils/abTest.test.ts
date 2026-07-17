import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getABTestVariant } from './abTest';

describe('getABTestVariant', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns stored A variant', () => {
    localStorage.setItem('syverro_ab_button', 'A');
    expect(getABTestVariant('button', 'left', 'right')).toBe('left');
  });

  it('returns stored B variant', () => {
    localStorage.setItem('syverro_ab_button', 'B');
    expect(getABTestVariant('button', 'left', 'right')).toBe('right');
  });

  it('assigns and persists a random variant when missing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    expect(getABTestVariant('button', 'left', 'right')).toBe('left');
    expect(localStorage.getItem('syverro_ab_button')).toBe('A');
  });
});