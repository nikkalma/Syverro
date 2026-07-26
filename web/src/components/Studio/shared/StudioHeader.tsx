import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../locales';

interface StudioHeaderProps {
  moduleName: string;
  theme?: string;
  onToggleTheme?: () => void;
}

export default function StudioHeader({ moduleName, theme, onToggleTheme }: StudioHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const t = getLocaleData(getBrowserLocale());

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
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Studio..."
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
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.width = '260px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-soft)';
              e.currentTarget.style.width = '200px';
            }}
          />
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
