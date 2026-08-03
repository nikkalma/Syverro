import { useState, useEffect, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import HistoricalDateField from '../../../../../components/Studio/shared/HistoricalDateField';
import PlaceSelector from '../../../../../components/Studio/shared/PlaceSelector';
import SourcePicker from '../../../../../components/Studio/shared/SourcePicker';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { TimelineEvent, TimelineEventCreate, DatePrecision } from '../../../../../types/admin';

function emptyEvent(): TimelineEventCreate {
  return {
    event_type: 'milestone',
    date_value: '',
    date_precision: 'year',
    label: '',
    description: null,
    place_id: null,
    source_id: null,
    confidence: 1.0,
    status: 'verified',
    sort_order: 0,
  };
}

const EVENT_TYPES = ['birth', 'death', 'publication', 'award', 'milestone'];

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

const EVENT_COLORS: Record<string, string> = {
  birth: 'var(--primary)',
  death: 'var(--primary)',
  publication: 'var(--success)',
  award: 'var(--warning)',
  milestone: 'var(--text-muted)',
};

export default function Timeline() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading } = useAuthorEditor();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<TimelineEventCreate>(emptyEvent());
  const [fetching, setFetching] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!author) return;
    setFetching(true);
    try {
      const res = await apiClient.get(`/admin/authors/${author.id}/timeline`);
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    } finally {
      setFetching(false);
    }
  }, [author]);

  useEffect(() => {
    if (author) fetchEvents();
  }, [author, fetchEvents]);

  const startAdd = () => {
    setDraft({ ...emptyEvent(), sort_order: events.length });
    setEditingIdx(-1);
  };

  const startEdit = (idx: number) => {
    const ev = events[idx];
    setDraft({
      event_type: ev.event_type,
      date_value: ev.date_value,
      date_precision: ev.date_precision as DatePrecision,
      label: ev.label,
      description: ev.description,
      place_id: ev.place_id,
      source_id: ev.source_id,
      confidence: ev.confidence,
      status: ev.status,
      sort_order: ev.sort_order,
    });
    setEditingIdx(idx);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setDraft(emptyEvent());
  };

  const saveEvent = async () => {
    if (!author || !draft.label.trim()) return;
    try {
      if (editingIdx === -1) {
        await apiClient.post(`/admin/authors/${author.id}/timeline`, draft);
      } else if (editingIdx !== null && events[editingIdx]) {
        const ev = events[editingIdx];
        await apiClient.put(`/admin/authors/${author.id}/timeline/${ev.id}`, draft);
      }
      cancelEdit();
      await fetchEvents();
    } catch (e) {
      console.error('Failed to save timeline event', e);
    }
  };

  const deleteEvent = async (idx: number) => {
    if (!author) return;
    const ev = events[idx];
    if (!ev?.id) return;
    if (!window.confirm(t.admin.authors.editor.timeline.confirmedDelete)) return;
    try {
      await apiClient.delete(`/admin/authors/${author.id}/timeline/${ev.id}`);
      await fetchEvents();
    } catch (e) {
      console.error('Failed to delete timeline event', e);
    }
  };

  const moveEvent = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const reordered = [...events];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((ev, i) => ({ ...ev, sort_order: i }));
    setEvents(updated);
    if (!author) return;
    try {
      await Promise.all(
        updated.map((ev) =>
          apiClient.put(`/admin/authors/${author.id}/timeline/${ev.id}`, { sort_order: ev.sort_order })
        )
      );
      await fetchEvents();
    } catch {
      await fetchEvents();
    }
  };

  const formatEventDate = (ev: TimelineEvent): string => {
    if (!ev.date_value) return '';
    let text = ev.date_value;
    if (text.startsWith('~')) { text = '~' + text.slice(1); }
    if (text.startsWith('-')) { text = text.slice(1) + ' BCE'; }
    return text;
  };

  if (loading || !author) return null;

  const tl = t.admin.authors.editor.timeline;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {fetching && events.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t.admin.common.loading}
        </div>
      )}
      {!fetching && events.length === 0 && editingIdx === null && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          {tl.noEvents}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {events.map((ev, i) => (
          <div
            key={ev.id}
            draggable={editingIdx === null}
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
            onDragEnd={() => {
              if (dragIdx !== null && dragOverIdx !== null) {
                moveEvent(dragIdx, dragOverIdx);
              }
              setDragIdx(null);
              setDragOverIdx(null);
            }}
            style={{
              display: 'flex', gap: '12px', alignItems: 'stretch',
              padding: '10px 0',
              borderBottom: i < events.length - 1 ? '1px solid var(--border-soft)' : 'none',
              opacity: dragIdx === i ? 0.4 : 1,
              borderTop: dragOverIdx === i && dragIdx !== null && dragIdx > i ? '2px solid var(--accent)' : 'none',
              borderBottomColor: dragOverIdx === i && dragIdx !== null && dragIdx < i ? 'var(--accent)' : undefined,
              cursor: editingIdx === null ? 'grab' : 'default',
            }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '32px', flexShrink: 0,
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: EVENT_COLORS[ev.event_type] || 'var(--text-muted)',
                flexShrink: 0,
              }} />
              {i < events.length - 1 && (
                <div style={{ width: '1px', flex: 1, background: 'var(--border-soft)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {formatEventDate(ev)}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '1px 6px', borderRadius: '4px' }}>
                  {ev.event_type}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', marginTop: '2px' }}>{ev.label}</div>
              {ev.description && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>{ev.description}</div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px' }}>
                <button type="button" onClick={() => startEdit(i)}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                  {t.admin.common.edit}
                </button>
                <button type="button" onClick={() => deleteEvent(i)}
                  style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                  {tl.deleteEvent}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingIdx !== null && (
        <EditorSectionCard title={editingIdx === -1 ? tl.addEvent : tl.editEvent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label={tl.eventType}>
              <select value={draft.event_type} onChange={(e) => setDraft({ ...draft, event_type: e.target.value })}
                style={inputStyle}>
                {EVENT_TYPES.map((et) => (
                  <option key={et} value={et}>{(t.admin.authors.editor.timeline as any)[et] || et}</option>
                ))}
              </select>
            </Field>
            <HistoricalDateField
              label={tl.datePrecision}
              value={draft.date_value}
              precision={draft.date_precision as DatePrecision}
              onChange={(v, p) => setDraft({ ...draft, date_value: v, date_precision: p })}
            />
            <Field label={tl.label}>
              <input type="text" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                style={inputStyle} placeholder={t.admin.studioCleanup.timelineLabelPlaceholder} />
            </Field>
            <Field label={tl.description}>
              <textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                placeholder={t.admin.studioCleanup.timelineDescriptionPlaceholder} />
            </Field>
            <PlaceSelector
              label={tl.eventPlace}
              placeId={draft.place_id}
              placeName={null}
              onChange={(id, _name) => setDraft({ ...draft, place_id: id })}
            />
            <SourcePicker
              label={tl.eventSource}
              sourceId={draft.source_id}
              onChange={(id) => setDraft({ ...draft, source_id: id })}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={cancelEdit}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {t.admin.common.cancel}
              </button>
              <button type="button" onClick={saveEvent} disabled={!draft.label.trim()}
                style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                {t.admin.common.save}
              </button>
            </div>
          </div>
        </EditorSectionCard>
      )}

      {editingIdx === null && (
        <button type="button" onClick={startAdd}
          style={{
            padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px',
            border: '1px dashed var(--border-soft)',
            fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
          {tl.addEvent}
        </button>
      )}
    </div>
  );
}
