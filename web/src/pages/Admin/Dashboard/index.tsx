// src/pages/Admin/Dashboard/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminDashboardStats } from '../../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import StatCard from './StatCard';
import RecentUsers from './RecentUsers';
import RecentActivity from './RecentActivity';
import { apiClient } from '../../../shared/api/client';

export default function AdminDashboard() {
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
            <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', height: '100px' }}>
              <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '12px' }} />
              <div style={{ height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '60%' }} />
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

  if (!stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>
        {t.admin.dashboard.noData}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
        📊 {t.admin.dashboard.title}
      </h1>

      {/* ===== СТАТИСТИКА ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        <StatCard label={t.admin.dashboard.users} value={stats.total_users} icon="👥" color="#5B86A1" />
        <StatCard label={t.admin.dashboard.books} value={stats.total_books} icon="📚" color="#4CAF50" />
        <StatCard label={t.admin.dashboard.authors} value={stats.total_authors} icon="✍️" color="#FFA726" />
        <StatCard label={t.admin.dashboard.genres} value={stats.total_genres} icon="🏷️" color="#AB47BC" />
        <StatCard label={t.admin.dashboard.activeUsers} value={stats.active_users} icon="🟢" color="#4CAF50" />
        <StatCard label={t.admin.dashboard.newUsers24h} value={stats.new_users_24h} icon="🆕" color="#EF5350" />
      </div>

      {/* ===== ТАБЛИЦЫ ===== */}
     <div className="dashboard-grid">
        <RecentUsers users={recentUsers} />
        <RecentActivity logs={recentLogs} />
      </div>
    </div>
  );
}
