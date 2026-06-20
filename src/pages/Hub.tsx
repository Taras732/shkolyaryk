import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';

const MASCOTS: Record<string, string> = {
  dragon: '/creatures/zodiac_dragon_fire.png',
  tiger: '/creatures/zodiac_tiger_metal.png',
  rabbit: '/creatures/zodiac_rabbit_wood.png',
  horse: '/creatures/zodiac_horse_water.png',
  ox: '/creatures/zodiac_ox_earth.png',
  monkey: '/creatures/zodiac_monkey_fire.png'
};

const GRADE3_TOPICS = [
  {
    id: 'math_equations',
    name: 'Рівняння ❔',
    description: 'Знайди невідоме число (наприклад, x + 120 = 400).',
    emoji: '❔',
    color: '#E8F5E9',
    borderColor: '#2EC4B6'
  },
  {
    id: 'ext_multiplication',
    name: 'Множення & Ділення ✖️',
    description: 'Обчислення поза табличкою (наприклад, 14 × 6 або 360 ÷ 3).',
    emoji: '✖️',
    color: '#FFF9C4',
    borderColor: '#FFD25A'
  },
  {
    id: 'ops_to_1000',
    name: 'Числа до 1000 ➕',
    description: 'Додавання та віднімання великих чисел (наприклад, 340 + 270).',
    emoji: '➕',
    color: '#FFE0B2',
    borderColor: '#FF9F43'
  },
  {
    id: 'fractions',
    name: 'Дроби & Частини 🍕',
    description: 'Знаходження частини від числа та числа за його частиною.',
    emoji: '🍕',
    color: '#F3E5F5',
    borderColor: '#9C27B0'
  }
];

const PRESCHOOL_TOPICS = [
  {
    id: 'pre_counting',
    name: 'Лічба 🔢',
    description: 'Рахуємо предмети від 1 до 10.',
    emoji: '🔢',
    color: '#E3F2FD',
    borderColor: '#3B9EF0'
  },
  {
    id: 'pre_addition',
    name: 'Додавання ➕',
    description: 'Скільки разом? Додаємо маленькі числа.',
    emoji: '➕',
    color: '#E8F5E9',
    borderColor: '#22C55E'
  },
  {
    id: 'pre_compare',
    name: 'Більше-менше ⚖️',
    description: 'Де більше предметів? Порівнюємо кількість.',
    emoji: '⚖️',
    color: '#FFF3E0',
    borderColor: '#FF9F43'
  }
];

const isPreschoolGroup = (ageGroup: string) => ageGroup === '5-6' || ageGroup === 'under_4';

export default function Hub() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeProfile, progress, loadProfiles } = useProfileStore();

  useEffect(() => {
    if (!activeProfile) {
      loadProfiles(user?.id).then(() => {
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
        color: 'var(--primary-dark)',
        fontFamily: 'var(--font-display)',
        fontSize: '18px'
      }}>
        Підготовка... 🐼
      </div>
    );
  }

  const preschool = isPreschoolGroup(activeProfile.age_group);
  const topics = preschool ? PRESCHOOL_TOPICS : GRADE3_TOPICS;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      background: 'linear-gradient(180deg, #DCE8FF 0%, #ECE6FF 55%, #FCEAF2 100%)',
      overflowY: 'auto'
    }}>
      {/* Header Profile Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--surface-card)',
        border: '3px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        padding: '10px 14px',
        boxShadow: '0 4px 0 var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#FFEAA7',
            border: '2px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.1)'
          }}>
            {MASCOTS[activeProfile.avatar_id] &&
              <img src={MASCOTS[activeProfile.avatar_id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-dark)' }}>
              {activeProfile.nickname}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--primary-dark)', fontWeight: '800' }}>
              {preschool ? 'Дошкільнятко' : '3-й клас'} · ⭐ {activeProfile.total_stars} зірок
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/onboarding')}
          className="btn-clay"
          style={{
            padding: '6px 12px',
            fontSize: '10px',
            borderRadius: 'var(--border-radius-sm)',
            boxShadow: '0 2px 0 var(--border-color)'
          }}
        >
          Змінити
        </button>
      </div>

      {/* Main Island Selection */}
      <div style={{ margin: '20px 0' }}>
        <h3 className="font-display" style={{
          fontSize: '16px',
          color: 'var(--text-dark)',
          textAlign: 'center',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          {preschool ? 'Завдання для малят 🧸' : 'Острів Математики 🏝️'}
        </h3>

        {/* Puzzle Levels / Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px'
        }}>
          {topics.map((topic, index) => {
            const topicProgress = progress[activeProfile.id]?.[topic.id] || { level: 1, stars: 0 };
            
            return (
              <div 
                key={topic.id}
                onClick={() => navigate(`/game/${topic.id}`)}
                className="card-clay"
                style={{
                  background: topic.color,
                  borderWidth: '3px',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  transform: index % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)'
                }}
              >
                {/* Topic Emoji Box */}
                <div style={{
                  width: '54px',
                  height: '54px',
                  background: '#fff',
                  border: '3px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '28px',
                  boxShadow: '0 3px 0 var(--border-color)'
                }}>
                  {topic.emoji}
                </div>

                {/* Info & Stars */}
                <div style={{ flex: 1 }}>
                  <h4 className="font-display" style={{
                    fontSize: '13px',
                    color: 'var(--text-dark)'
                  }}>
                    {topic.name}
                  </h4>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    lineHeight: '1.3',
                    fontWeight: '600'
                  }}>
                    {topic.description}
                  </p>

                  {/* Stars list */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-dark)', opacity: 0.8 }}>
                      Рівень {topicProgress.level}
                    </span>
                    <span style={{ opacity: 0.2, fontSize: '10px' }}>|</span>
                    <div style={{ display: 'flex', gap: '1px' }}>
                      {[1, 2, 3].map(starNum => (
                        <span 
                          key={starNum} 
                          style={{
                            fontSize: '12px',
                            filter: starNum <= topicProgress.stars ? 'none' : 'grayscale(100%) opacity(25%)'
                          }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parental Gate Link */}
      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/parent')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-dark)',
            fontWeight: '800',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Налаштування батьків ⚙️
        </button>
      </div>
    </div>
  );
}
