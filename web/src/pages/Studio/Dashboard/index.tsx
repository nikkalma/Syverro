import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, PenLine, Tags, UserCheck, UserPlus, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminDashboardStats } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import StatCard from '../../../components/Studio/shared/StatCard';
import RecentUsers from './RecentUsers';
import RecentActivity from './RecentActivity';
import DashboardModuleCards from './DashboardModuleCards';
import { apiClient } from '../../../shared/api/client';

export default function StudioHome() {
  const navigate = useNavigate();
  const { isLoading, setLoading, error, setError } = useAdminStore();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const statsRes = await apiClient.get('/admin/stats');
      setStats(statsRes.data);

      const usersRes = await apiClient.get('/admin/users/recent');
      setRecentUsers(usersRes.data || []);

      const logsRes = await apiClient.get('/admin/logs/recent');
      setRecentLogs(logsRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ padding: '20px', background: 'var(--surface-hover)', borderRadius: '14px', height: '100px' }}>
              <div style={{ height: '20px', background: 'var(--border-soft)', borderRadius: '4px', marginBottom: '12px' }} />
              <div style={{ height: '30px', background: 'var(--surface-hover)', borderRadius: '4px', width: '60%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        <div style={{ display: 'inline-flex', color: 'var(--error)', marginBottom: '16px' }}><AlertCircle size={40} /></div>
        <h2>{t.admin.dashboard.errorLoading}</h2>
        <p>{error}</p>
        <button
          onClick={fetchDashboardData}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.common.retry}
        </button>
      </div>
    );
  }

  const snapshotCards = [
    { label: t.admin.dashboard.users, value: stats?.total_users ?? 0, icon: <Users size={18} />, to: '/studio/users' },
    { label: t.admin.dashboard.books, value: stats?.total_books ?? 0, icon: <BookOpen size={18} />, to: '/studio/books' },
    { label: t.admin.dashboard.authors, value: stats?.total_authors ?? 0, icon: <PenLine size={18} />, to: '/studio/authors' },
    { label: t.admin.dashboard.genres, value: stats?.total_genres ?? 0, icon: <Tags size={18} />, to: '/studio/genres' },
    { label: t.admin.dashboard.activeUsers, value: stats?.active_users ?? 0, icon: <UserCheck size={18} />, to: '/studio/users' },
    { label: t.admin.dashboard.newUsers24h, value: stats?.new_users_24h ?? 0, icon: <UserPlus size={18} />, to: '/studio/users' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '400', color: 'var(--text-primary)', margin: 0, marginBottom: '4px', fontFamily: "'Playfair Display', serif", letterSpacing: '0.01em' }}>
          {t.admin.dashboard.title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          {t.admin.authors.editor.workspaceOverview}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {snapshotCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            onClick={() => navigate(card.to)}
          />
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)', margin: 0, marginBottom: '16px' }}>
          {t.admin.authors.editor.workspaces}
        </h2>
        <DashboardModuleCards t={t} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>
          {t.admin.authors.editor.activity}
        </h2>
        <div className="dashboard-grid">
          <RecentActivity logs={recentLogs} />
          <RecentUsers users={recentUsers} />
        </div>
      </div>
    </div>
  );
}