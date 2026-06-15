import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../shared/api/client'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { access_token } = response.data
      setToken(access_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа')
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
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/register" className="link">Нет аккаунта? Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  )
}