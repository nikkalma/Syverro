// src/components/Hero.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

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
        minHeight: '320px',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)',
        border: '1px solid var(--border-soft)',
        padding: '40px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '40px',
        transition: 'all 0.4s ease',
      }}
    >
      {/* ===== ПЛАНЕТА (анимированная) ===== */}
      <div
        style={{
          position: 'absolute',
          right: '40px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '160px',
          height: '160px',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
        className="planet-container"
      >
        <div className="planet">
          <div className="planet-ring ring-1"></div>
          <div className="planet-ring ring-2"></div>
          <div className="planet-core"></div>
          <div className="planet-spot spot-1"></div>
          <div className="planet-spot spot-2"></div>
          <div className="planet-spot spot-3"></div>
          <div className="planet-spot spot-4"></div>
        </div>
      </div>

      {/* ===== ТЕКСТОВАЯ ЧАСТЬ ===== */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '65%' }}>
        {/* Приветствие */}
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
                {user.email?.split('@')[0]}
              </span>
              👋
            </>
          ) : (
            'Добро пожаловать в Syverro ✦'
          )}
        </h1>

        {/* Цитата дня */}
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

        {/* Индикаторы цитат */}
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

        {/* Кнопка (если не авторизован) */}
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

      {/* ===== СТИЛИ ДЛЯ ПЛАНЕТЫ (внутри компонента) ===== */}
      <style>{`
        .planet-container {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(-55%) translateX(-10px); }
          100% { transform: translateY(-50%) translateX(0); }
        }

        .planet {
          width: 100%;
          height: 100%;
          position: relative;
          animation: rotatePlanet 30s linear infinite;
        }

        @keyframes rotatePlanet {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .planet-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60%;
          height: 60%;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, var(--primary), var(--bg));
          box-shadow: inset -10px -10px 30px rgba(0,0,0,0.6),
                      inset 10px 10px 30px rgba(91, 134, 161, 0.2);
        }

        .planet-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1.5px solid var(--glass-border);
        }

        .ring-1 {
          width: 110%;
          height: 110%;
          animation: ringPulse 4s ease-in-out infinite alternate;
        }

        .ring-2 {
          width: 130%;
          height: 130%;
          border-style: dashed;
          animation: ringPulse 6s ease-in-out infinite alternate-reverse;
        }

        @keyframes ringPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.1; }
        }

        .planet-spot {
          position: absolute;
          border-radius: 50%;
          background: rgba(91, 134, 161, 0.15);
        }

        .spot-1 {
          width: 18%;
          height: 18%;
          top: 22%;
          left: 28%;
          background: rgba(91, 134, 161, 0.2);
        }
        .spot-2 {
          width: 12%;
          height: 12%;
          top: 55%;
          left: 15%;
          background: rgba(97, 166, 161, 0.15);
        }
        .spot-3 {
          width: 20%;
          height: 20%;
          top: 60%;
          left: 60%;
          background: rgba(91, 134, 161, 0.12);
        }
        .spot-4 {
          width: 8%;
          height: 8%;
          top: 30%;
          left: 70%;
          background: rgba(151, 166, 186, 0.15);
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

          .hero-container .planet-container {
            width: 100px;
            height: 100px;
            align-self: center;
            position: relative;
            right: auto;
            top: auto;
            transform: none;
          }

          .hero-container .planet-container .planet {
            animation: rotatePlanet 20s linear infinite;
          }

          .hero-container div[style*="maxWidth: 65%"] {
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

          .hero-container .planet-container {
            animation: none;
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

          .hero-container .planet-container {
            width: 70px;
            height: 70px;
          }
        }
      `}</style>
    </div>
  );
}