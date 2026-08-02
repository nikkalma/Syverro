// Editorial Intelligence — presentational research overview.
// Renders structured editorial progress inside an existing entity workspace.
// Pure UI: no entity logic, no percentages, no fake analytics. Localized via t.admin.editorial.

import { ScanSearch } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import type { EditorialReport, EditorialStatus } from './types';

const STATUS_COLOR: Record<EditorialStatus, string> = {
  completed: 'var(--success)',
  attention: 'var(--warning)',
  missing: 'var(--error)',
  unavailable: 'var(--text-muted)',
};

interface Props {
  report: EditorialReport;
}

export default function EditorialIntelligence({ report }: Props) {
  const t = getLocaleData(getBrowserLocale());
  const ei = t.admin.editorial;

  const tally: Record<EditorialStatus, number> = {
    completed: 0,
    attention: 0,
    missing: 0,
    unavailable: 0,
  };
  for (const group of report.groups) {
    for (const step of group.steps) tally[step.status] += 1;
  }

  const labels: Record<EditorialStatus, string> = {
    completed: ei.statuses.completed,
    attention: ei.statuses.attention,
    missing: ei.statuses.missing,
    unavailable: ei.statuses.unavailable,
  };

  return (
    <section style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: '14px',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          color: 'var(--primary)',
          background: 'var(--primary-soft)',
          border: '1px solid var(--primary)',
          flexShrink: 0,
        }}>
          <ScanSearch size={17} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {ei.title}
            </h3>
            {report.entityTypeLabel && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{report.entityTypeLabel}</span>
            )}
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {ei.subtitle}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '2px' }}>
        {(Object.keys(tally) as EditorialStatus[]).map((key) => (
          <span
            key={key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              background: 'var(--surface-hover)',
              borderRadius: '999px',
              padding: '4px 10px',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: STATUS_COLOR[key],
              opacity: key === 'unavailable' ? 0.5 : 1,
            }} />
            {labels[key]} <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{tally[key]}</span>
          </span>
        ))}
      </div>

      {report.groups.length === 0 ? (
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ei.empty}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {report.groups.map((group) => (
            <div
              key={group.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                fontWeight: '600',
              }}>
                {ei.groups[group.id] || group.id}
              </div>
              {group.steps.map((step) => (
                <div key={step.key} style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLOR[step.status], alignSelf: 'center', flexShrink: 0, opacity: step.status === 'unavailable' ? 0.5 : 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{step.label}</div>
                    {step.details && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {step.status === 'unavailable' ? ei.notTracked : step.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}