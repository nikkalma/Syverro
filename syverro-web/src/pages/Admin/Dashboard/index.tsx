// src/pages/Admin/Dashboard/index.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminDashboardStats } from '../../../types/admin';
import StatCard from './StatCard';
import RecentUsers from './RecentUsers';
import RecentActivity from './RecentActivity';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminDashboard() {
  const { isLoading, setLoading, error, setError } = useAdminStore();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Статистика
      const statsRes = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!statsRes.ok) throw new Error('Ошибка загрузки статистики');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Последние пользователи
      const usersRes = await fetch(`${API_URL}/admin/users/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setRecentUsers(usersData);
      }

      // Последние логи
      const logsRes = await fetch(`${API_URL}/admin/logs/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentLogs(logsData);
      }
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
        <h2>Ошибка загрузки</h2>
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
          Повторить
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>
        Нет данных для отображения
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '400', color: '#E6EDF3', margin: 0 }}>
        📊 Dashboard
      </h1>

      {/* ===== СТАТИСТИКА ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        <StatCard label="Пользователи" value={stats.total_users} icon="👥" color="#5B86A1" />
        <StatCard label="Книги" value={stats.total_books} icon="📚" color="#4CAF50" />
        <StatCard label="Авторы" value={stats.total_authors} icon="✍️" color="#FFA726" />
        <StatCard label="Жанры" value={stats.total_genres} icon="🏷️" color="#AB47BC" />
        <StatCard label="Активные пользователи" value={stats.active_users} icon="🟢" color="#4CAF50" />
        <StatCard label="Новых за 24ч" value={stats.new_users_24h} icon="🆕" color="#EF5350" />
      </div>

      {/* ===== ТАБЛИЦЫ ===== */}
     <div className="dashboard-grid">
        <RecentUsers users={recentUsers} />
        <RecentActivity logs={recentLogs} />
      </div>
    </div>
  );
}