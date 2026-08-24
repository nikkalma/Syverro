// src/pages/Admin/Authors/AuthorsTable.tsx

import { Pencil, Trash2, AlertCircle, PenLine, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { AdminAuthor, getAuthorDisplayName } from '../../../types/admin';
import { useAdminStore } from '../../../store/adminStore';
import { authorUrl } from '../../../shared/utils/authorUrl';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import {
  authorEditorialSignals,
  conciseBlockedReason,
  formatMetadataStatus,
  formatRelativeActivity,
  isResearchBlocked,
  type AuthorSignal,
} from './authorEditorialStatus';

const SIGNAL_COLORS: Record<AuthorSignal['kind'], string> = {
  'sources-needed': '#EF5350', 'sources-review': '#FFA726', 'corpus-ready': '#4CAF50',
  'proposals-review': '#FFA726', 'changes-ready': '#5B86A1', 'changes-applied': '#4CAF50',
};

interface AuthorsTableProps {
  authors: AdminAuthor[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  canManage: boolean;
  onEdit: (author: AdminAuthor) => void;
  onDelete: (author: AdminAuthor) => void;
  onRefresh: () => void;
}

export default function AuthorsTable({
  authors,
  loading,
  error,
  total,
  page,
  limit,
  canManage,
  onEdit,
  onDelete,
  onRefresh,
}: AuthorsTableProps) {
  const { setPage } = useAdminStore();
  const totalPages = Math.ceil(total / limit);
  const t = getLocaleData(getBrowserLocale());

  // ===== СКЕЛЕТОН =====
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="studio-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t.admin.authors.photo, t.admin.authors.name, t.admin.authors.metadataStatus, t.admin.authors.attention, t.admin.authors.readinessLabel, t.admin.authors.activity, t.admin.authors.actions].map((h) => (
                <th key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {[...Array(7)].map((_, j) => (
                  <td key={j}>
                    <div style={{ height: '20px', background: 'var(--chip)', borderRadius: '4px', width: j === 0 ? '40px' : j === 6 ? '60%' : '80%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ===== ОШИБКА =====
  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--error)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--error)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--error)', marginBottom: '12px' }}><AlertCircle size={32} /></div>
        <p>{error}</p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.common.retry}
        </button>
      </div>
    );
  }

  // ===== ПУСТО =====
  if (authors.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }}><PenLine size={48} /></div>
        <p>{t.admin.authors.noAuthors}</p>
      </div>
    );
  }

  // ===== ТАБЛИЦА =====
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="studio-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th>{t.admin.authors.photo}</th>
            <th>{t.admin.authors.name}</th>
            <th>{t.admin.authors.metadataStatus}</th>
            <th>{t.admin.authors.attention}</th>
            <th>{t.admin.authors.readinessLabel}</th>
            <th>{t.admin.authors.activity}</th>
            <th>{t.admin.authors.actions}</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author) => (
            <tr
              key={author.id}
              style={{
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'var(--primary)',
                  overflow: 'hidden',
                }}>
                  {author.photo ? (
                    <img src={author.photo} alt={getAuthorDisplayName(author)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getAuthorDisplayName(author).charAt(0).toUpperCase() || '👤'
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', minWidth: '180px' }}>
                <button type="button" onClick={() => onEdit(author)}
                  style={{ color: 'var(--primary)', background: 'none', border: 0, padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                  {getAuthorDisplayName(author)}
                </button>
                {author.sort_name && author.sort_name !== getAuthorDisplayName(author) && <div style={{ marginTop: '3px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 400 }}>{author.sort_name}</div>}
                <div style={{ marginTop: '3px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 400 }}>{author.country || '—'} · {author.book_count || 0} {t.admin.authors.books.toLowerCase()}</div>
              </td>
              <td style={{ minWidth: '130px' }}>
                <span style={{ padding: '4px 9px', borderRadius: '10px', background: 'var(--chip)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600 }}>
                  {formatMetadataStatus(author.metadata_status || 'draft')}
                </span>
              </td>
              <td style={{ minWidth: '230px' }}>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {authorEditorialSignals(author).map((signal) => {
                    const labels: Record<AuthorSignal['kind'], string> = {
                      'sources-needed': t.admin.authors.sourcesNeeded,
                      'sources-review': `${signal.count} ${t.admin.authors.sourcesToReview}`,
                      'corpus-ready': t.admin.authors.corpusReady,
                      'proposals-review': `${signal.count} ${t.admin.authors.proposalsToReview}`,
                      'changes-ready': `${signal.count} ${t.admin.authors.changesReadyToApply}`,
                      'changes-applied': `${signal.count} ${t.admin.authors.changesApplied}`,
                    };
                    const color = SIGNAL_COLORS[signal.kind];
                    return <span key={signal.kind} style={{ padding: '3px 7px', borderRadius: '9px', background: `${color}1f`, color, fontSize: '10px' }}>{labels[signal.kind]}</span>;
                  })}
                </div>
              </td>
              <td style={{ minWidth: '190px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {author.publication_ready ? (
                  <span style={{ color: 'var(--success)' }}>{t.admin.authors.publicationReady}</span>
                ) : (author.missing_required_fields || []).length <= 2 ? (
                  <span>{t.admin.authors.missing}: {(author.missing_required_fields || []).join(', ') || '—'}</span>
                ) : (
                  <span title={(author.missing_required_fields || []).join(', ')}>{(author.missing_required_fields || []).length} {t.admin.authors.missingCount}</span>
                )}
              </td>
              <td style={{ minWidth: '180px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {!author.last_syvai_run_at ? t.admin.authors.noSyvaiActivity : isResearchBlocked(author) ? (
                  <span style={{ color: 'var(--error)' }}>{t.admin.authors.researchBlocked}{conciseBlockedReason(author.last_syvai_run_reason) ? `: ${conciseBlockedReason(author.last_syvai_run_reason)}` : ''}</span>
                ) : (
                  <span>{t.admin.authors.lastSyvai}: {author.last_syvai_run_domain?.replace(/_/g, ' ') || '—'} · {formatRelativeActivity(author.last_syvai_run_at)}</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a href={authorUrl(author)} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '4px 10px',
                      background: 'var(--primary-soft)',
                      border: '1px solid var(--primary)',
                      borderRadius: '6px',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      textDecoration: 'none',
                    }}>
                    <ExternalLink size={12} aria-label={t.admin.authors.publicPreview} />
                  </a>
                  {canManage && (
                    <>
                      <button
                        onClick={() => onEdit(author)}
                        title={t.admin.common.edit}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--chip)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(author)}
                        title={t.admin.common.delete}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--chip)',
                          border: '1px solid var(--error)',
                          borderRadius: '6px',
                          color: 'var(--error)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== ПАГИНАЦИЯ ===== */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid var(--border)',
          marginTop: '8px',
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {t.admin.common.showing} {authors.length} {t.admin.common.of} {total}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px',
                background: 'var(--chip)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '6px 14px', color: 'var(--text-primary)', fontSize: '13px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 14px',
                background: 'var(--chip)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
