import { useState, useRef, useEffect } from 'react';

export type DatePrecision = 'full' | 'month_year' | 'year' | 'approximate';

interface HistoricalDateFieldProps {
  label: string;
  value: string;
  precision: DatePrecision;
  onChange: (value: string, precision: DatePrecision) => void;
}

const MONTH_NAMES: Record<string, string> = {
  january: '01', jan: '01', janv: '01',
  february: '02', feb: '02', fév: '02', fevr: '02',
  march: '03', mar: '03', mars: '03',
  april: '04', apr: '04', avr: '04',
  may: '05', mai: '05',
  june: '06', jun: '06', juin: '06',
  july: '07', jul: '07', juil: '07',
  august: '08', aug: '08', août: '08', aout: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10', octo: '10',
  november: '11', nov: '11',
  december: '12', dec: '12', déc: '12',
};

function parseMonthName(text: string): string | null {
  const lower = text.toLowerCase().replace(/[^a-zéèêëàâùûüôöîïç]/g, '');
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (lower === name || lower.startsWith(name.slice(0, 3))) return num;
  }
  return null;
}

function naturalParse(input: string): { day: string; month: string; year: string; bce: boolean; approx: boolean } {
  let text = input.trim();
  let bce = false;
  let approx = false;

  if (/^(~|≈|ca\.?|circa)\s*/i.test(text)) {
    approx = true;
    text = text.replace(/^(~|≈|ca\.?|circa)\s*/i, '');
  }

  if (/\b(BCE|BC|B\.C\.E?|B\.C\.)\s*$/i.test(text)) {
    bce = true;
    text = text.replace(/\s*(BCE|BC|B\.C\.E?|B\.C\.)\s*$/i, '');
  }

  text = text.trim();

  const dayMatch = text.match(/^(\d{1,2})\s*/);
  const day = dayMatch ? dayMatch[1].padStart(2, '0') : '';

  let remaining = dayMatch ? text.slice(dayMatch[0].length).trim() : text;

  const monthText = remaining.match(/^([a-zA-Zéèêëàâùûüôöîïç]+)/);
  let month = '';
  if (monthText) {
    const parsed = parseMonthName(monthText[1]);
    if (parsed) {
      month = parsed;
      remaining = remaining.slice(monthText[0].length).trim();
      remaining = remaining.replace(/^[,.\s]+/, '');
    }
  }

  const yearMatch = remaining.match(/^(-?\d{1,4})/);
  let year = '';
  if (yearMatch) {
    year = yearMatch[1];
  }

  if (bce && year && !year.startsWith('-')) {
    year = '-' + year.padStart(4, '0');
  }

  return { day, month, year, bce, approx };
}

function composeCanonical(day: string, month: string, year: string, bce: boolean, approx: boolean, precision: DatePrecision): string {
  let base = '';
  if (precision === 'full' && day && month) {
    base = `${year}-${month}-${day}`;
  } else if (precision === 'month_year' && month) {
    base = `${year}-${month}`;
  } else {
    base = year;
  }
  if (bce && !base.startsWith('-') && base !== year) {
    base = '-' + base;
  }
  if (approx) {
    base = '~' + base;
  }
  return base;
}

function formatReadable(value: string, precision: DatePrecision): string {
  if (!value) return '';
  let text = value;
  let prefix = '';
  if (text.startsWith('~')) {
    prefix = '≈ ';
    text = text.slice(1);
  }
  let bce = false;
  if (text.startsWith('-')) {
    bce = true;
    text = text.slice(1);
  }
  const parts = text.split('-');
  const y = parts[0] || '';
  const m = parts[1] || '';
  const d = parts[2] || '';

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  let display = '';
  if (precision === 'full' && d && m) {
    const mn = monthNames[parseInt(m, 10)] || m;
    display = `${parseInt(d, 10)} ${mn} ${y}`;
  } else if (precision === 'month_year' && m) {
    const mn = monthNames[parseInt(m, 10)] || m;
    display = `${mn} ${y}`;
  } else if (precision === 'year') {
    display = y;
  } else if (precision === 'approximate') {
    display = y;
  }
  if (bce) display += ' BCE';
  return prefix + display;
}

const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'month_year', label: 'Month+Year' },
  { value: 'year', label: 'Year' },
  { value: 'approximate', label: '≈' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-muted)', marginBottom: '4px',
};

export default function HistoricalDateField({ label, value, precision, onChange }: HistoricalDateFieldProps) {
  const [textInput, setTextInput] = useState('');
  const [activePrecision, setActivePrecision] = useState<DatePrecision>(precision);
  const [parsed, setParsed] = useState({ day: '', month: '', year: '', bce: false, approx: false });
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      const p = naturalParse(value);
      setParsed(p);
      setActivePrecision(precision);
      setTextInput(formatReadable(value, precision));
      initialized.current = true;
    }
  }, [value, precision]);

  const emitChange = (d: string, m: string, y: string, b: boolean, a: boolean, p: DatePrecision) => {
    const composed = composeCanonical(d, m, y, b, a, p);
    onChange(composed, p);
  };

  const handleTextChange = (raw: string) => {
    setTextInput(raw);
    const result = naturalParse(raw);
    setParsed(result);
    let detectedPrecision: DatePrecision = 'year';
    if (result.approx) detectedPrecision = 'approximate';
    else if (result.day && result.month) detectedPrecision = 'full';
    else if (result.month) detectedPrecision = 'month_year';
    setActivePrecision(detectedPrecision);
    emitChange(result.day, result.month, result.year, result.bce, result.approx, detectedPrecision);
  };

  const handlePrecisionChange = (p: DatePrecision) => {
    setActivePrecision(p);
    emitChange(parsed.day, parsed.month, parsed.year, parsed.bce, parsed.approx, p);
  };

  const handleBceToggle = () => {
    const next = !parsed.bce;
    const newParsed = { ...parsed, bce: next };
    setParsed(newParsed);
    emitChange(newParsed.day, newParsed.month, newParsed.year, next, newParsed.approx, activePrecision);
  };

  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input
        type="text"
        value={textInput}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="e.g. 1816, April 1816, 15 April 1816, ~550 BCE"
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {PRECISION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handlePrecisionChange(opt.value)}
            style={{
              padding: '3px 8px', fontSize: '11px', borderRadius: '4px',
              border: `1px solid ${activePrecision === opt.value ? 'var(--accent)' : 'var(--border-soft)'}`,
              background: activePrecision === opt.value ? 'rgba(91,134,161,0.15)' : 'transparent',
              color: activePrecision === opt.value ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            {opt.label}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '8px' }}>
          <input type="checkbox" checked={parsed.bce} onChange={handleBceToggle} />
          BCE
        </label>
      </div>
      {value && (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
          {formatReadable(value, precision)}
        </div>
      )}
    </div>
  );
}

export { formatReadable, naturalParse };
