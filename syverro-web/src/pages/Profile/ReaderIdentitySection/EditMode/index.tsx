import { useState } from 'react';
import { TagSelect } from './TagSelect';
import { COUNTRIES, LANGUAGES, GENRES, THEMES, VIBES, MOTIFS, MOODS, ERAS } from '../constants';
import { readingGoalLabels } from '../../../../types/reader';
import { LocaleData } from '../../../../locales';

const GOALS = [
  'relaxation',
  'emotions',
  'knowledge',
  'self-development',
  'inspiration',
  'escapism',
  'work-study',
] as const;

type Goal = typeof GOALS[number];

interface EditModeProps {
  profile: any;
  t: LocaleData;
  onSave: (profile: any) => void;
  onCancel: () => void;
}

export function EditMode({ profile, t, onSave, onCancel }: EditModeProps) {
  const [data, setData] = useState(profile);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChange = (key: string, value: any) => {
    setData({ ...data, [key]: value });
  };

  const handleGoalToggle = (goal: Goal) => {
    const current = data.readingGoals || [];
    const updated = current.includes(goal)
      ? current.filter((g: string) => g !== goal)
      : [...current, goal];
    setData({ ...data, readingGoals: updated });
  };

  const countryOptions = COUNTRIES.map((key) => ({
    label: t.taxonomy.countries?.[key] || key,
    value: key,
  }));

  const languageOptions = LANGUAGES.map((key) => ({
    label: t.taxonomy.languages?.[key] || key,
    value: key,
  }));

  const genreOptions = GENRES.map((g) => ({
    label: g,
    value: g,
  }));

  const themeOptions = THEMES.map((key) => ({
    label: t.taxonomy.theme[key] || key,
    value: key,
  }));

  const vibeOptions = VIBES.map((key) => ({
    label: t.taxonomy.vibe[key] || key,
    value: key,
  }));

  const eraOptions = ERAS.map((era) => ({
    label: t.taxonomy.eras?.[era.value] || era.label,
    value: era.value,
  }));

  const handleSave = () => {
    onSave(data);
  };

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        maxWidth: '100%',
        position: 'relative',
        zIndex: isDropdownOpen ? 10000 : 1,
      }}
    >
      <h2 style={{ fontSize: '20px', fontWeight: '400', color: '#E6EDF3', marginBottom: '4px' }}>
        ✏️ Редактирование ориентиров
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Language Profile */}
        <div
          style={{
            background: 'rgba(10, 17, 24, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h3 style={{ fontSize: '13px', color: '#5B86A1', fontWeight: '500', marginBottom: '16px' }}>
            🌍 Языковой профиль
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#97A6BA', display: 'block', marginBottom: '4px' }}>
                {t.nativeCountry}
              </label>
              <select
                value={data.nativeCountry || ''}
                onChange={(e) => handleChange('nativeCountry', e.target.value)}
                className="syverro-select"
              >
                <option value="">Не указано</option>
                {countryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#97A6BA', display: 'block', marginBottom: '4px' }}>
                {t.currentCountry}
              </label>
              <select
                value={data.currentCountry || ''}
                onChange={(e) => handleChange('currentCountry', e.target.value)}
                className="syverro-select"
              >
                <option value="">Не указано</option>
                {countryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#97A6BA', display: 'block', marginBottom: '4px' }}>
                {t.nativeLanguage}
              </label>
              <select
                value={data.nativeLanguage || ''}
                onChange={(e) => handleChange('nativeLanguage', e.target.value)}
                className="syverro-select"
              >
                <option value="">Не указано</option>
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <TagSelect
              value={data.spokenLanguages || []}
              options={languageOptions}
              onChange={(val) => handleChange('spokenLanguages', val)}
              label={t.spokenLanguages}
              placeholder="Выберите языки..."
              onOpenChange={setIsDropdownOpen}
            />
          </div>

          <div>
            <TagSelect
              value={data.readingLanguages || []}
              options={languageOptions}
              onChange={(val) => handleChange('readingLanguages', val)}
              label={t.readingLanguages}
              placeholder="Выберите языки чтения..."
              onOpenChange={setIsDropdownOpen}
            />
            <div style={{ fontSize: '11px', color: '#5B86A1', marginTop: '4px' }}>
              {t.readingLanguagesHint}
            </div>
          </div>
        </div>

        {/* Taste Profile */}
        <div
          style={{
            background: 'rgba(10, 17, 24, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h3 style={{ fontSize: '13px', color: '#5B86A1', fontWeight: '500', marginBottom: '16px' }}>
            📚 Вкусы
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TagSelect
              value={data.favoriteGenres || []}
              options={genreOptions}
              onChange={(val) => handleChange('favoriteGenres', val)}
              label={t.favoriteGenres}
              placeholder="Выберите жанры..."
              onOpenChange={setIsDropdownOpen}
            />

            <TagSelect
              value={data.favoriteThemes || []}
              options={themeOptions}
              onChange={(val) => handleChange('favoriteThemes', val)}
              label={t.favoriteThemes}
              placeholder="Выберите темы..."
              onOpenChange={setIsDropdownOpen}
            />

            <TagSelect
              value={data.favoriteVibes || []}
              options={vibeOptions}
              onChange={(val) => handleChange('favoriteVibes', val)}
              label={t.favoriteVibes}
              placeholder="Выберите вайбы..."
              onOpenChange={setIsDropdownOpen}
            />

            <TagSelect
              value={data.favoriteLiteraryCountries || []}
              options={countryOptions}
              onChange={(val) => handleChange('favoriteLiteraryCountries', val)}
              label={t.favoriteLiteraryCountries}
              placeholder="Выберите страны..."
              onOpenChange={setIsDropdownOpen}
            />

            <TagSelect
              value={data.favoriteEras || []}
              options={eraOptions}
              onChange={(val) => handleChange('favoriteEras', val)}
              label={t.favoriteEras}
              placeholder="Выберите эпохи..."
              onOpenChange={setIsDropdownOpen}
            />

            <div>
              <label style={{ fontSize: '11px', color: '#97A6BA', display: 'block', marginBottom: '4px' }}>
                {t.favoriteAuthors}
              </label>
              <input
                type="text"
                value={data.favoriteAuthors?.join(', ') || ''}
                onChange={(e) => {
                  const authors = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                  handleChange('favoriteAuthors', authors);
                }}
                placeholder={t.favoriteAuthorsPlaceholder}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(18, 28, 36, 0.6)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
          </div>
        </div>

        {/* Reading Goals */}
        <div
          style={{
            background: 'rgba(18, 28, 36, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h3 style={{ fontSize: '13px', color: '#5B86A1', fontWeight: '500', marginBottom: '12px' }}>
            🎯 {t.readingGoals}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => handleGoalToggle(goal)}
                style={{
                  padding: '6px 16px',
                  background: data.readingGoals?.includes(goal)
                    ? 'rgba(91, 134, 161, 0.3)'
                    : 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: data.readingGoals?.includes(goal)
                    ? '1px solid rgba(91, 134, 161, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  color: data.readingGoals?.includes(goal) ? '#E6EDF3' : '#97A6BA',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                  width: 'auto',
                }}
                onMouseEnter={(e) => {
                  if (!data.readingGoals?.includes(goal)) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#E6EDF3';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!data.readingGoals?.includes(goal)) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#97A6BA';
                  }
                }}
              >
                {readingGoalLabels[goal]}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              background: '#5B86A1',
              border: 'none',
              borderRadius: '8px',
              color: '#0A1118',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4A7590')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#5B86A1')}
          >
            💾 {t.save}
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(42, 75, 96, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#E6EDF3',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(42, 75, 96, 0.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(42, 75, 96, 0.4)')}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}