import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  label: string;
  value: string;
}

interface TagSelectProps {
  value: string[];
  options: Option[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export function TagSelect({
  value,
  options,
  onChange,
  placeholder,
  label,
  onOpenChange,
}: TagSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => updateDropdownPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOpenChange]);

  const handleOpen = () => {
    updateDropdownPosition();
    setIsOpen(true);
    onOpenChange?.(true);
  };

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) &&
      !value.includes(opt.value)
  );

  const handleAdd = (option: Option) => {
    onChange([...value, option.value]);
    setSearch('');
    setTimeout(() => {
      setIsOpen(false);
      onOpenChange?.(false);
    }, 100);
  };

  const handleRemove = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  const getLabel = (key: string): string => {
    const found = options.find((o) => o.value === key);
    return found ? found.label : key;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ fontSize: '11px', color: '#97A6BA', display: 'block', marginBottom: '4px' }}>
          {label}
        </label>
      )}

      <div
        ref={inputRef}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '8px 12px',
          background: 'rgba(18, 28, 36, 0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          minHeight: '44px',
          alignItems: 'center',
          cursor: 'text',
          transition: 'border-color 0.2s',
        }}
        onClick={handleOpen}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        {value.map((key) => (
          <span
            key={key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              fontSize: '13px',
              color: '#E6EDF3',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
          >
            {getLabel(key)}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(key);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#5B86A1',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0 2px',
                width: 'auto',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E6EDF3')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#5B86A1')}
            >
              ×
            </button>
          </span>
        ))}

        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateDropdownPosition();
          }}
          onFocus={handleOpen}
          placeholder={value.length === 0 ? placeholder || 'Select...' : ''}
          style={{
            flex: 1,
            minWidth: '60px',
            background: 'transparent',
            border: 'none',
            color: '#E6EDF3',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            padding: '4px 0',
          }}
        />
      </div>

      {isOpen &&
        createPortal(
          <div
            className="sidebar-scroll"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              background: 'rgba(18, 28, 36, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 999999,
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
              padding: '4px 0',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#5B86A1', fontSize: '13px' }}>
                {search ? 'Nothing found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAdd(opt);
                  }}
                  style={{
                    padding: '8px 16px',
                    color: '#E6EDF3',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}