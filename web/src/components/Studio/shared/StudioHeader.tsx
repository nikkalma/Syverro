import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import {
  Search, Sun, Moon, CornerDownLeft, Home, Users, BookOpen, PenLine, Tags, Landmark, Folder, ShieldAlert, FileText, ScrollText, Settings, ExternalLink,
} from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import type { LocaleData } from '../../../locales';

interface StudioHeaderProps {
  moduleName: string;
  theme?: string;
  onToggleTheme?: () => void;
}

const getQuickModules = (t: LocaleData): { path: string; icon: React.ReactNode; label: string }[] => [
  { path: '/studio', icon: <Home size={14} />, label: t.admin.nav.dashboard },
  { path: '/studio/users', icon: <Users size={14} />, label: t.admin.nav.users },
  { path: '/studio/books', icon: <BookOpen size={14} />, label: t.admin.nav.books },
  { path: '/studio/authors', icon: <PenLine size={14} />, label: t.admin.nav.authors },
  { path: '/studio/genres', icon: <Tags size={14} />, label: t.admin.nav.genres },
  { path: '/studio/taxonomy', icon: <Landmark size={14} />, label: t.admin.nav.taxonomy },
  { path: '/studio/entities', icon: <Folder size={14} />, label: t.admin.nav.entities },
  { path: '/studio/moderation', icon: <ShieldAlert size={14} />, label: t.admin.nav.moderation },
  { path: '/studio/metadata', icon: <FileText size={14} />, label: t.admin.nav.metadata },
  { path: '/studio/logs', icon: <ScrollText size={14} />, label: t.admin.nav.logs },
  { path: '/studio/settings', icon: <Settings size={14} />, label: t.admin.nav.settings },
];

export default function StudioHeader({ moduleName, theme, onToggleTheme }: StudioHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const t = getLocaleData(getBrowserLocale());

  const quickModules = useMemo(() => getQuickModules(t), [t]);

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return quickModules;
    return quickModules.filter((m) =>
      m.label.toLowerCase().includes(q) || m.path.toLowerCase().includes(q)
    );
  }, [quickModules, searchQuery]);

  const goTo = (path: string) => {
    setSearchQuery('');
    setActiveIndex(0);
    setIsFocused(false);
    inputRef.current?.blur();
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length) goTo(results[activeIndex].path);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border-soft)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexShrink: 0,
      gap: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          <Link to="/studio" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              fontFamily: "'Playfair Display', serif",
              letterSpacing: '2px',
            }}>
              {t.admin.siteName}
            </span>
            <span style={{
              fontSize: '11px',
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: '500',
            }}>
              {t.admin.brand}
            </span>
          </Link>
          {moduleName && (
            <>
              <span style={{
                fontSize: '16px',
                color: 'var(--text-muted)',
                fontWeight: '300',
                marginLeft: '4px',
              }}>
                /
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: '400',
                color: 'var(--text-secondary)',
              }}>
                {moduleName}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        <Link
          to="/"
          aria-label="Перейти из студии на сайт"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            background: 'var(--bg)',
            border: '1px solid var(--border-soft)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          <ExternalLink size={14} />
          На сайт
        </Link>

        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search size={14} style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(0);
            }}
            onFocus={(e) => {
              setIsFocused(true);
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.width = '260px';
            }}
            onBlur={(e) => {
              setTimeout(() => setIsFocused(false), 120);
              e.currentTarget.style.borderColor = 'var(--border-soft)';
              e.currentTarget.style.width = '200px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={t.admin.authors.editor.searchStudio}
            style={{
              padding: '6px 10px 6px 30px',
              fontSize: '13px',
              background: 'var(--bg)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '200px',
              fontFamily: 'Inter, sans-serif',
              transition: 'border-color 0.2s, width 0.2s',
            }}
          />

          {isFocused && results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              maxHeight: '320px',
              overflowY: 'auto',
              background: 'var(--surface)',
              border: '1px solid var(--border-soft)',
              borderRadius: '10px',
              boxShadow: 'var(--glass-shadow)',
              padding: '6px',
              zIndex: 60,
            }}>
              {results.map((mod, idx) => (
                <button
                  key={mod.path}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    goTo(mod.path);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    background: idx === activeIndex ? 'var(--primary-soft)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'inline-flex', color: 'var(--primary)', flexShrink: 0, opacity: 0.9 }}>{mod.icon}</span>
                  <span style={{ flex: 1 }}>{mod.label}</span>
                  {idx === activeIndex && <CornerDownLeft size={12} style={{ color: 'var(--text-muted)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>
    </header>
  );
}
