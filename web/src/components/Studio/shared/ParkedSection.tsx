import { ArrowLeft, PauseCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studioPath } from '../../../shared/utils/studioRoutes';

export default function ParkedSection() {
  return (
    <div style={{
      minHeight: '55vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
    }}>
      <section style={{
        width: '100%',
        maxWidth: '560px',
        padding: '32px',
        textAlign: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        borderRadius: '16px',
        boxShadow: 'var(--glass-shadow)',
      }}>
        <PauseCircle size={32} aria-hidden="true" style={{ color: 'var(--primary)', marginBottom: '12px' }} />
        <h1 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Section temporarily unavailable
        </h1>
        <p style={{ margin: '0 auto 24px', maxWidth: '460px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This Studio section is currently parked while its editorial model is being revised. Existing data has not been removed.
        </p>
        <Link to={studioPath()} className="glass-button glass-button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}
