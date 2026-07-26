import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminDashboardStats } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import StatCard from '../../../components/Studio/shared/StatCard';
import RecentUsers from './RecentUsers';
import RecentActivity from './RecentActivity';
import DashboardModuleCards from './DashboardModuleCards';
import { apiClient } from '../../../shared/api/client';
import EmptyWorkspace from '../../../components/Studio/shared/EmptyWorkspace';

export default function StudioHome() {
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
            <div key={i} style={{ padding: '20px', background: 'var(--surface-hover)', borderRadius: '12px', height: '100px' }}>
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
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF5350' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2>{t.admin.dashboard.errorLoading}</h2>
        <p>{error}</p>
        <button
          onClick={fetchDashboardData}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.admin.common.retry}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>
          {t.admin.dashboard.title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Overview of your workspace activity
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        <StatCard label={t.admin.dashboard.users} value={stats?.total_users ?? 0} icon="👥" color="#5B86A1" />
        <StatCard label={t.admin.dashboard.books} value={stats?.total_books ?? 0} icon="📚" color="#4CAF50" />
        <StatCard label={t.admin.dashboard.authors} value={stats?.total_authors ?? 0} icon="✍️" color="#FFA726" />
        <StatCard label={t.admin.dashboard.genres} value={stats?.total_genres ?? 0} icon="🏷️" color="#AB47BC" />
        <StatCard label={t.admin.dashboard.activeUsers} value={stats?.active_users ?? 0} icon="🟢" color="#4CAF50" />
        <StatCard label={t.admin.dashboard.newUsers24h} value={stats?.new_users_24h ?? 0} icon="🆕" color="#EF5350" />
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)', margin: 0, marginBottom: '16px' }}>
          Workspaces
        </h2>
        <DashboardModuleCards t={t} />
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', margin: 0 }}>
            Recently Edited
          </h3>
          <EmptyWorkspace
            icon="✏️"
            title="No recent edits"
            description="Entities you edit in Studio will appear here for quick access."
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', margin: 0 }}>
            Needs Attention
          </h3>
          <EmptyWorkspace
            icon="🔍"
            title="All complete"
            description="Entities with missing fields or incomplete data will appear here."
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>
          Activity
        </h2>
        <div className="dashboard-grid">
          <RecentActivity logs={recentLogs} />
          <RecentUsers users={recentUsers} />
        </div>
      </div>
    </div>
  );
}
