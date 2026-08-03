import { useState, useEffect } from 'react';
import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import EditorialIntelligence from '../../../../../components/Studio/editorialIntelligence/EditorialIntelligence';
import { buildBookReport, type BookEditorialLabels } from '../editorialIntelligence';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

export default function Overview() {
  const t = getLocaleData(getBrowserLocale());
  const { book, saving, saveError, saveBook, saveEnrichment } = useBookWorkspace();
  const bLocale = t.admin.books;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [cover, setCover] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [publicationType, setPublicationType] = useState<'official' | 'unofficial'>('official');
  const [description, setDescription] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [year, setYear] = useState('');
  const [totalPages, setTotalPages] = useState('');

  useEffect(() => {
    if (!book) return;
    setTitle(book.title || '');
    setAuthor(book.author || '');
    setCover(book.cover || '');
    setGenres(book.genres || []);
    setGenreIds(book.genre_ids || []);
    setPublicationType(book.publication_type || 'official');
    setDescription(book.description || '');
    setOriginalTitle(book.original_title || '');
    setOriginalLanguage(book.original_language || '');
    setCountryOfOrigin(book.country_of_origin || '');
    setYear(book.original_publication_year != null ? String(book.original_publication_year) : '');
    setTotalPages(book.total_pages != null ? String(book.total_pages) : '');
  }, [book]);

  if (!book) return null;

  const hasChanges = Boolean(
    title !== book.title ||
    author !== book.author ||
    cover !== (book.cover || '') ||
    genres.join(',') !== (book.genres || []).join(',') ||
    publicationType !== book.publication_type ||
    description !== (book.description || '') ||
    originalTitle !== (book.original_title || '') ||
    originalLanguage !== (book.original_language || '') ||
    countryOfOrigin !== (book.country_of_origin || '') ||
    year !== (book.original_publication_year != null ? String(book.original_publication_year) : '') ||
    totalPages !== (book.total_pages != null ? String(book.total_pages) : '')
  );

  const reset = () => {
    setTitle(book.title || '');
    setAuthor(book.author || '');
    setCover(book.cover || '');
    setGenres(book.genres || []);
    setGenreIds(book.genre_ids || []);
    setPublicationType(book.publication_type || 'official');
    setDescription(book.description || '');
    setOriginalTitle(book.original_title || '');
    setOriginalLanguage(book.original_language || '');
    setCountryOfOrigin(book.country_of_origin || '');
    setYear(book.original_publication_year != null ? String(book.original_publication_year) : '');
    setTotalPages(book.total_pages != null ? String(book.total_pages) : '');
  };

  const handleSave = async () => {
    const yearNum = year.trim() ? Number(year.trim()) : null;
    const pagesNum = totalPages.trim() ? Number(totalPages.trim()) : null;
    await saveBook({
      title: title.trim(),
      author: author.trim(),
      cover: cover.trim() || null,
      genres,
      genre_ids: genreIds,
      publication_type: publicationType,
      description: description.trim() || null,
      total_pages: pagesNum && !Number.isNaN(pagesNum) ? pagesNum : null,
    });
    await saveEnrichment({
      original_title: originalTitle.trim() || null,
      original_language: originalLanguage.trim() || null,
      country_of_origin: countryOfOrigin.trim() || null,
      original_publication_year: yearNum && !Number.isNaN(yearNum) ? yearNum : null,
    });
  };

  const editorialLabels: BookEditorialLabels = {
    name: bLocale.name,
    author: bLocale.author,
    cover: bLocale.coverUrl,
    genres: bLocale.genres,
    description: bLocale.description,
    pages: bLocale.pages,
    status: bLocale.status,
  };
  const editorialReport = buildBookReport(book, editorialLabels);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorialIntelligence report={editorialReport} />
      <EditorSectionCard title={bLocale.name}>
        <DetailGrid columns={2}>
          <FormField label={bLocale.name} value={title} onChange={setTitle} />
          <FormField label={bLocale.author} value={author} onChange={setAuthor} />
        </DetailGrid>
        <div style={{ marginTop: '12px' }}>
          <FormField label={bLocale.coverUrl} value={cover} onChange={setCover} placeholder="https://example.com/cover.jpg" />
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.workspace.sections.identity}>
        <DetailGrid columns={2}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {bLocale.publicationType}
            </div>
            <select value={publicationType} onChange={(e) => setPublicationType(e.target.value as 'official' | 'unofficial')} style={inputStyle}>
              <option value="official">{bLocale.officialDesc}</option>
              <option value="unofficial">{bLocale.unofficialDesc}</option>
            </select>
          </div>
          <FormField label={bLocale.originalTitle} value={originalTitle} onChange={setOriginalTitle} />
          <FormField label={bLocale.originalLanguage} value={originalLanguage} onChange={setOriginalLanguage} />
          <FormField label={bLocale.countryOfOrigin} value={countryOfOrigin} onChange={setCountryOfOrigin} />
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {bLocale.originalYear}
            </div>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {bLocale.pages}
            </div>
            <input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} style={inputStyle} />
          </div>
        </DetailGrid>
      </EditorSectionCard>

      <EditorSectionCard title={bLocale.description}>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}
          placeholder={bLocale.descriptionPlaceholder} />
      </EditorSectionCard>

      {saveError && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', color: 'var(--error)', fontSize: '13px' }}>
          {saveError}
        </div>
      )}

      <ActionBar
        onSave={handleSave}
        onCancel={reset}
        saving={saving}
        dirty={hasChanges}
        saveLabel={t.admin.common.save}
        savingLabel={t.admin.common.saving}
        cancelLabel={t.admin.common.cancel}
      />
    </div>
  );
}
