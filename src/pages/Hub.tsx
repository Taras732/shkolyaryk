import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';

const MASCOTS: Record<string, string> = {
  chicken: '🐣',
  panda: '🐼',
  fox: '🦊',
  owl: '🦉'
};

const GAMES = {
  under_4: {
    id: 'count_objects',
    name: 'Порахуй предмети 🍎',
    description: 'Вчимося рахувати предмети від 1 до 5 граючись.',
    emoji: '🍎'
  },
  '5-6': {
    id: 'number_comparison',
    name: 'Порівняй числа ⚖️',
    description: 'Визначаємо, яке число більше, менше чи вони рівні.',
    emoji: '⚖️'
  },
  '6-7': {
    id: 'math_slalom',
    name: 'Математичний слалом ⛷️',
    description: 'Додавання та віднімання в межах 20 на швидкість.',
    emoji: '⛷️'
  },
  '7-8': {
    id: 'multiplication_table',
    name: 'Таблиця множення ❌',
    description: 'Тренажер таблиці множення в ігровій формі.',
    emoji: '❌'
  }
};

export default function Hub() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeProfile, progress, loadProfiles } = useProfileStore();

  // If no profiles loaded or active profile null, check auth status and try to load
  useEffect(() => {
    if (!activeProfile) {
      loadProfiles(user?.id).then(() => {
        // If still null after load, redirect to onboarding
        if (!useProfileStore.getState().activeProfile) {
          navigate('/onboarding');
        }
      });
    }
  }, [activeProfile, user, loadProfiles, navigate]);

  if (!activeProfile) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        color: 'var(--primary)'
      }}>
        Перевірка профілю... 🐼
      </div>
    );
  }

  const ageGroup = activeProfile.age_group;
  const game = GAMES[ageGroup] || GAMES['5-6']; // Fallback
  
  // Fetch progress for this specific child profile and game
  const childProgress = progress[activeProfile.id]?.[game.id] || { level: 1, stars: 0 };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px',
      background: 'radial-gradient(circle at top left, #F7E6FF, #DFE6FF)',
      overflowY: 'auto'
    }}>
      {/* Top Header Profile Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--surface-card)',
        border: '3px solid var(--text-dark)',
        borderRadius: 'var(--border-radius-md)',
        padding: '12px 16px',
        boxShadow: '0 4px 0 var(--text-dark)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--surface-soft)',
            border: '2px solid var(--text-dark)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '28px'
          }}>
            {MASCOTS[activeProfile.avatar_id] || '🐼'}
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-dark)' }}>
              {activeProfile.nickname}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
              ⭐ {activeProfile.total_stars} зірочок
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/onboarding')}
          style={{
            background: 'var(--primary-light)',
            color: '#fff',
            border: '2px solid var(--text-dark)',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            boxShadow: '0 2px 0 var(--text-dark)'
          }}
        >
          Гравці
        </button>
      </div>

      {/* Main Island Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '32px 0'
      }}>
        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          color: 'var(--text-dark)',
          marginBottom: '16px',
          textShadow: '0 2px 0 #fff'
        }}>
          Острів Математики 🏝️
        </h3>

        {/* Playable Game Card */}
        <div 
          onClick={() => navigate(`/game/${game.id}`)}
          style={{
            width: '100%',
            maxWidth: '320px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            color: '#fff',
            border: '4px solid var(--text-dark)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: '0 8px 0 var(--text-dark)',
            padding: '32px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            transform: 'rotate(-1deg)',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(4px) rotate(-1deg)';
            e.currentTarget.style.boxShadow = '0 4px 0 var(--text-dark)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0) rotate(-1deg)';
            e.currentTarget.style.boxShadow = '0 8px 0 var(--text-dark)';
          }}
        >
          {/* Game Emoji */}
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{game.emoji}</div>
          
          {/* Game Title */}
          <h4 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 'bold',
            textShadow: '0 2px 0 var(--primary-dark)'
          }}>
            {game.name}
          </h4>

          {/* Description */}
          <p style={{
            fontSize: '12px',
            opacity: 0.9,
            marginTop: '8px',
            lineHeight: '1.4'
          }}>
            {game.description}
          </p>

          {/* Progress Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            background: 'rgba(31, 27, 58, 0.2)',
            padding: '8px 12px',
            borderRadius: 'var(--border-radius-full)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
              Рівень {childProgress.level}
            </span>
            <span style={{ opacity: 0.5 }}>|</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3].map(starNum => (
                <span 
                  key={starNum} 
                  style={{
                    fontSize: '14px',
                    filter: starNum <= childProgress.stars ? 'none' : 'grayscale(100%) opacity(30%)'
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Parental gate entry */}
      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/parent')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Кабінет батьків ⚙️
        </button>
      </div>
    </div>
  );
}
