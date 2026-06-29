// src/components/Hero.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';

const QUOTES = [
  { text: "Книга — это мечта, которую ты держишь в руках.", author: "Нил Гейман" },
  { text: "Чтение — это побег, который возвращает тебя домой.", author: "Карл Саган" },
  { text: "Книги — это корабли мысли, странствующие по волнам времени.", author: "Фрэнсис Бэкон" },
  { text: "Тот, кто читает, живёт тысячу жизней.", author: "Джордж Р. Р. Мартин" },
  { text: "Библиотека — это аптека для души.", author: "Гомер" },
  { text: "Хорошая книга — это бесконечный разговор.", author: "Иосиф Бродский" },
  { text: "Чтение — это диалог с автором, который длится вечно.", author: "Эмили Дикинсон" },
  { text: "Книга — самая большая драгоценность, которую можно подарить.", author: "Стивен Кинг" },
  { text: "Чтение — это единственный способ пожить чужой жизнью.", author: "Умберто Эко" },
  { text: "Книги — это зеркала, в которых мы видим себя.", author: "Харпер Ли" },
];

export function Hero() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [quoteIndex, setQuoteIndex] = useState(0);

  const profile = storageService.getReaderProfile();
  const displayName = profile?.displayName || 'Читатель';

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = QUOTES[quoteIndex];

  return (
    <div
      className="hero-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '280px',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'transparent',
        padding: '40px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '40px',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Атмосфера */}
      <div
        style={{
          position: 'absolute',
          right: '-60px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '400px',
          height: '400px',
          opacity: 0.25,
          pointerEvents: 'none',
          filter: 'blur(40px)',
          background: 'radial-gradient(circle at 35% 35%, var(--primary), var(--bg))',
          borderRadius: '50%',
          boxShadow: '0 0 120px var(--primary)',
          transition: 'all 0.6s ease',
        }}
        className="planet-atmosphere"
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '70%' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '300',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            fontFamily: "'Playfair Display', serif",
            letterSpacing: '1px',
            transition: 'color 0.3s ease',
          }}
        >
          {user ? (
            <>
              Добро пожаловать,{' '}
              <span style={{ color: 'var(--primary)', fontWeight: '500' }}>
                {displayName}
              </span>
              👋
            </>
          ) : (
            'Добро пожаловать в Syverro ✦'
          )}
        </h1>

        <div className="quote-block" style={{ marginTop: '12px' }}>
          <p
            className="quote-text"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              margin: '0',
              lineHeight: '1.6',
              borderLeft: '3px solid var(--primary)',
              paddingLeft: '16px',
              transition: 'color 0.3s ease, border-color 0.3s ease',
              minHeight: '60px',
            }}
          >
            “{currentQuote.text}”
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              margin: '4px 0 0 20px',
              fontFamily: "'Inter', sans-serif",
              transition: 'color 0.3s ease',
            }}
          >
            — {currentQuote.author}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {QUOTES.map((_, index) => (
            <span
              key={index}
              onClick={() => setQuoteIndex(index)}
              style={{
                width: index === quoteIndex ? '24px' : '8px',
                height: '6px',
                borderRadius: '4px',
                background: index === quoteIndex ? 'var(--primary)' : 'var(--border-soft)',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
              }}
            />
          ))}
        </div>

        {!user && (
          <button
            onClick={() => navigate('/login')}
            className="glass-btn glass-btn-primary"
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              fontSize: '15px',
            }}
          >
            <Sparkles size={18} />
            Начать путь
          </button>
        )}
      </div>

      <style>{`
        .hero-container {
          position: relative;
          overflow: hidden;
          background: var(--bg);
        }

        .planet-atmosphere {
          animation: floatAtmosphere 8s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes floatAtmosphere {
          0% { transform: translateY(-50%) translateX(0) scale(1); }
          50% { transform: translateY(-55%) translateX(-10px) scale(1.05); }
          100% { transform: translateY(-50%) translateX(0) scale(1); }
        }

        .quote-text {
          transition: opacity 0.6s ease;
        }

        @media (max-width: 768px) {
          .hero-container {
            padding: 24px 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
            min-height: auto;
          }

          .hero-container .planet-atmosphere {
            width: 300px;
            height: 300px;
            right: -40px;
            filter: blur(50px);
          }

          .hero-container div[style*="maxWidth: 70%"] {
            max-width: 100%;
            width: 100%;
          }

          .hero-container h1 {
            font-size: 24px;
          }

          .hero-container .quote-text {
            font-size: 14px;
            min-height: 40px;
          }
        }

        @media (max-width: 480px) {
          .hero-container {
            padding: 16px;
            border-radius: 16px;
          }

          .hero-container h1 {
            font-size: 20px;
          }

          .hero-container .quote-text {
            font-size: 13px;
            padding-left: 12px;
          }

          .hero-container .planet-atmosphere {
            width: 200px;
            height: 200px;
            right: -30px;
            filter: blur(40px);
          }
        }
      `}</style>
    </div>
  );
}