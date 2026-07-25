export type SearchNormalizer = (text: string) => string;

interface KeyboardMap {
  from: string;
  to: string;
}

const LATIN_TO_CYRILLIC: KeyboardMap[] = [
  { from: 'q', to: 'й' }, { from: 'w', to: 'ц' }, { from: 'e', to: 'у' },
  { from: 'r', to: 'к' }, { from: 't', to: 'е' }, { from: 'y', to: 'н' },
  { from: 'u', to: 'г' }, { from: 'i', to: 'ш' }, { from: 'o', to: 'щ' },
  { from: 'p', to: 'з' }, { from: '[', to: 'х' }, { from: ']', to: 'ъ' },
  { from: 'a', to: 'ф' }, { from: 's', to: 'ы' }, { from: 'd', to: 'в' },
  { from: 'f', to: 'а' }, { from: 'g', to: 'п' }, { from: 'h', to: 'р' },
  { from: 'j', to: 'о' }, { from: 'k', to: 'л' }, { from: 'l', to: 'д' },
  { from: ';', to: 'ж' }, { from: "'", to: 'э' }, { from: 'z', to: 'я' },
  { from: 'x', to: 'ч' }, { from: 'c', to: 'с' }, { from: 'v', to: 'м' },
  { from: 'b', to: 'и' }, { from: 'n', to: 'т' }, { from: 'm', to: 'ь' },
  { from: ',', to: 'б' }, { from: '.', to: 'ю' },
];

const CYRILLIC_TO_LATIN: KeyboardMap[] = LATIN_TO_CYRILLIC.map(({ from, to }) => ({
  from: to, to: from,
}));

function buildCharMap(maps: KeyboardMap[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { from, to } of maps) {
    map[from] = to;
    map[from.toUpperCase()] = to.toUpperCase();
  }
  return map;
}

const latinToCyrillicMap = buildCharMap(LATIN_TO_CYRILLIC);
const cyrillicToLatinMap = buildCharMap(CYRILLIC_TO_LATIN);

function transliterate(text: string, map: Record<string, string>): string {
  let result = '';
  for (const ch of text) {
    result += map[ch] || ch;
  }
  return result;
}

const COMMON_TRANSLITERATION: Record<string, string> = {
  shh: 'щ', sh: 'ш', ch: 'ч', zh: 'ж', yu: 'ю', ya: 'я',
  yo: 'ё', ye: 'е', ts: 'ц', kh: 'х',
  SCH: 'Щ', SH: 'Ш', CH: 'Ч', ZH: 'Ж', YU: 'Ю', YA: 'Я',
  YO: 'Ё', YE: 'Е', TS: 'Ц', KH: 'Х',
  Sch: 'Щ', Sh: 'Ш', Ch: 'Ч', Zh: 'Ж', Yu: 'Ю', Ya: 'Я',
  Yo: 'Ё', Ye: 'Е', Ts: 'Ц', Kh: 'Х',
};

function applyCommonTransliteration(text: string): string {
  let result = text;
  for (const [latin, cyrillic] of Object.entries(COMMON_TRANSLITERATION)) {
    result = result.replace(new RegExp(latin, 'g'), cyrillic);
  }
  return result;
}

export function normalizeSearch(text: string): string[] {
  const normalized = text.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) return [];

  const results = new Set<string>([normalized]);

  const cyrillicAttempt = transliterate(normalized, latinToCyrillicMap);
  if (cyrillicAttempt !== normalized) {
    results.add(cyrillicAttempt);
    const withCommon = applyCommonTransliteration(cyrillicAttempt);
    if (withCommon !== cyrillicAttempt) results.add(withCommon);
  }

  const latinAttempt = transliterate(normalized, cyrillicToLatinMap);
  if (latinAttempt !== normalized) {
    results.add(latinAttempt);
  }

  const commonApplied = applyCommonTransliteration(normalized);
  if (commonApplied !== normalized) {
    results.add(commonApplied);
  }

  return Array.from(results);
}

export function computeSearchAliases(...nameParts: (string | null | undefined)[]): string {
  return nameParts
    .filter((p): p is string => !!p)
    .map((p) => p.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(' | ');
}
