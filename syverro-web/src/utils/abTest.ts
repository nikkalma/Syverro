// src/utils/abTest.ts
export function getABTestVariant<T>(key: string, variantA: T, variantB: T): T {
  const stored = localStorage.getItem(`syverro_ab_${key}`);
  
  if (stored) {
    return stored === 'A' ? variantA : variantB;
  }

  const random = Math.random() < 0.5 ? 'A' : 'B';
  localStorage.setItem(`syverro_ab_${key}`, random);
  
  return random === 'A' ? variantA : variantB;
}