import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../shared/api/client'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)

    try {
      await apiClient.post('/api/v1/auth/register', { email, password })
      const response = await apiClient.post('/api/v1/auth/login', { email, password })
      const { access_token } = response.data
      setToken(access_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="orb"></div>
      <div className="glass-card">
        <h1>Syverro</h1>
        <div className="tagline">ПРОСТРАНСТВО ДЛЯ ЧТЕНИЯ</div>
        <div style={{ width: 60, height: 2, background: '#2A4B60', margin: '1.5rem auto' }}></div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/login" className="link">Уже есть аккаунт? Войти</Link>
        </div>
      </div>
    </div>
  )
}