import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'

interface UserProfile {
  id: number
  email: string
  created_at: string
}

export default function Profile() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const token = useAuthStore((state) => state.token)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadProfile()
    }
  }, [token])

  const loadProfile = async () => {
    try {
      const response = await apiClient.get('/users/me')
      setProfile(response.data)
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="orb"></div>
        <div className="glass-card">
          <h1>Профиль</h1>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="orb"></div>
      <div className="glass-card">
        <h1>Профиль</h1>
        <div className="tagline">ЛИЧНЫЕ ДАННЫЕ</div>
        <div style={{ width: 60, height: 2, background: '#2A4B60', margin: '1.5rem auto' }}></div>

        <div style={{ textAlign: 'left', marginTop: '2rem' }}>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Дата регистрации:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—'}</p>
          <p><strong>ID пользователя:</strong> {profile?.id}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
          <button onClick={() => navigate('/')} style={{ flex: 1, background: '#2A4B60' }}>
            ← Назад в библиотеку
          </button>
          <button onClick={logout} style={{ flex: 1, background: '#3A5570' }}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}