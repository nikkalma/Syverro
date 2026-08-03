import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AuthorQuote, AuthorQuoteCreate } from '../../../../../types/admin';
import SourcePicker from '../../../../../components/Studio/shared/SourcePicker';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: '60px',
};

export default function Quotes() {
  const { author } = useAuthorEditor();
  const locale = getLocaleData(getBrowserLocale());
  const qLocale = locale.admin.authors.editor.quotes;
  const [quotes, setQuotes] = useState<AuthorQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formText, setFormText] = useState('');
  const [formSpeaker, setFormSpeaker] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formQuoteType, setFormQuoteType] = useState('author');
  const [formSourceId, setFormSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'author' | 'about_author'>('author');

  const fetchQuotes = useCallback(async () => {
    if (!author) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/authors/${author.id}/quotes`);
      setQuotes(res.data?.data || []);
    } catch {
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [author]);

  useEffect(() => {
    if (author) fetchQuotes();
  }, [author, fetchQuotes]);

  const openNew = (type: string = 'author') => {
    setFormText('');
    setFormSpeaker('');
    setFormDate('');
    setFormQuoteType(type);
    setFormSourceId(null);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (q: AuthorQuote) => {
    setFormText(q.text);
    setFormSpeaker(q.speaker || '');
    setFormDate(q.date_value || '');
    setFormQuoteType(q.quote_type || 'author');
    setFormSourceId(q.source_id || null);
    setEditingId(q.id);
    setShowForm(true);
    setError(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormText('');
    setFormSpeaker('');
    setFormDate('');
    setFormQuoteType('author');
    setFormSourceId(null);
    setError(null);
  };

  const saveQuote = async () => {
    if (!author || !formText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: AuthorQuoteCreate = {
        text: formText.trim(),
        speaker: formSpeaker.trim() || null,
        quote_type: formQuoteType || 'author',
        source_id: formSourceId,
        date_value: formDate.trim() || null,
        status: 'verified',
        confidence: 1.0,
      };
      if (editingId) {
        await apiClient.put(`/admin/authors/${author.id}/quotes/${editingId}`, payload);
      } else {
        await apiClient.post(`/admin/authors/${author.id}/quotes`, payload);
      }
      cancelForm();
      await fetchQuotes();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || qLocale.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuote = async (id: string) => {
    if (!author) return;
    if (!window.confirm(qLocale.deleteConfirm)) return;
    try {
      await apiClient.delete(`/admin/authors/${author.id}/quotes/${id}`);
      await fetchQuotes();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || qLocale.errorDelete);
    }
  };

  if (!author) return null;

  const filteredQuotes = quotes.filter((q) => (q.quote_type || 'author') === activeTab);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: '8px',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    border: active ? 'none' : '1px solid var(--border-soft)',
    cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={locale.admin.authors.editor.sections.quotes}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button type="button" onClick={() => setActiveTab('author')} style={tabStyle(activeTab === 'author')}>
            {qLocale.byAuthor} ({quotes.filter((qx) => (qx.quote_type || 'author') === 'author').length})
          </button>
          <button type="button" onClick={() => setActiveTab('about_author')} style={tabStyle(activeTab === 'about_author')}>
            {qLocale.aboutAuthor} ({quotes.filter((qx) => qx.quote_type === 'about_author').length})
          </button>
        </div>

        {loading && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{qLocale.loading}</div>}

        {!loading && filteredQuotes.length === 0 && !showForm && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {activeTab === 'author' ? qLocale.noByAuthor : qLocale.noAboutAuthor}
          </p>
        )}

        {filteredQuotes.map((q) => (
          <div key={q.id} style={{
            padding: '12px 16px', marginBottom: '8px',
            background: 'var(--surface-hover)', borderRadius: '8px',
            border: '1px solid var(--border-soft)',
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '4px' }}>
              &ldquo;{q.text}&rdquo;
            </div>
            {q.speaker && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                — {q.speaker}
              </div>
            )}
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center',
              fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px',
            }}>
              <span style={{
                padding: '1px 6px', borderRadius: '4px',
                background: q.status === 'verified' ? 'rgba(76,175,80,0.15)' : 'rgba(255,167,38,0.15)',
                color: q.status === 'verified' ? '#4CAF50' : '#FFA726',
                fontSize: '10px', textTransform: 'uppercase',
              }}>
                {q.status}
              </span>
              <span>{(q.confidence * 100).toFixed(0)}%</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '4px', background: 'rgba(91,134,161,0.15)' }}>
                {q.quote_type || 'author'}
              </span>
              {q.date_value && <span>{q.date_value}</span>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => openEdit(q)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}>
                  {qLocale.edit}
                </button>
                <button type="button" onClick={() => deleteQuote(q.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '12px' }}>
                  {qLocale.delete}
                </button>
              </div>
            </div>
          </div>
        ))}

        {showForm && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {qLocale.quoteType}
              </div>
              <select value={formQuoteType} onChange={(e) => setFormQuoteType(e.target.value)}
                style={inputStyle}>
                <option value="author">{qLocale.byAuthor}</option>
                <option value="about_author">{qLocale.aboutAuthor}</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {qLocale.quoteText}
              </div>
              <textarea value={formText} onChange={(e) => setFormText(e.target.value)}
                placeholder={qLocale.quoteTextPlaceholder} style={textareaStyle} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {qLocale.speaker}
                </div>
                <input type="text" value={formSpeaker} onChange={(e) => setFormSpeaker(e.target.value)}
                  placeholder={qLocale.speakerPlaceholder} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {qLocale.date}
                </div>
                <input type="text" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  placeholder={qLocale.datePlaceholder} style={inputStyle} />
              </div>
            </div>
            <SourcePicker
              label={locale.admin.authors.editor.timeline.eventSource}
              sourceId={formSourceId}
              onChange={setFormSourceId}
            />
            {error && <div style={{ fontSize: '13px', color: 'var(--error)' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={cancelForm} disabled={saving}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {qLocale.cancel}
              </button>
              <button type="button" onClick={saveQuote} disabled={saving || !formText.trim()}
                style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                {saving ? qLocale.saving : editingId ? qLocale.updateQuote : qLocale.addQuote}
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <button type="button" onClick={() => openNew(activeTab === 'about_author' ? 'about_author' : 'author')}
            style={{
              marginTop: '12px', padding: '10px', width: '100%',
              background: 'var(--surface-hover)', borderRadius: '8px',
              border: '1px dashed var(--border-soft)',
              fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
            }}>
            + {activeTab === 'about_author' ? qLocale.addAboutAuthor : qLocale.addByAuthor}
          </button>
        )}
      </EditorSectionCard>
    </div>
  );
}
