import { useNavigate } from 'react-router-dom';

const ROLES = [
  {
    id: 'student',
    emoji: '🧒',
    title: 'Я учень',
    sub: 'Грати, вчитися й рости разом із другом-помічником!',
    to: '/onboarding',
    disabled: false
  },
  {
    id: 'parent',
    emoji: '👨‍👩‍👧',
    title: 'Батьки',
    sub: 'Бачити прогрес дитини й керувати профілями.',
    to: '/parent',
    disabled: false
  },
  {
    id: 'teacher',
    emoji: '👩‍🏫',
    title: 'Вчитель',
    sub: 'Клас, завдання та успіхи учнів — скоро!',
    to: '/parent',
    disabled: true
  }
];

export default function RoleSelect() {
  const navigate = useNavigate();

  const pick = (role: typeof ROLES[number]) => {
    if (role.disabled) return;
    try { localStorage.setItem('shk_role', role.id); } catch { /* ignore */ }
    navigate(role.to);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 24px',
      background: 'linear-gradient(180deg, #DCE8FF 0%, #ECE6FF 55%, #FCEAF2 100%)',
      overflowY: 'auto'
    }}>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <h1 className="font-display" style={{ fontSize: '24px', color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
          Хто заходить? 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px', fontWeight: '600' }}>
          Обери, як хочеш зайти у Школярик
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '28px' }}>
        {ROLES.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => pick(r)}
            disabled={r.disabled}
            className="card-clay"
            style={{
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '18px',
              cursor: r.disabled ? 'not-allowed' : 'pointer',
              opacity: r.disabled ? 0.55 : 1
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'var(--c-primary-soft)',
              border: '2px solid var(--c-line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              flexShrink: 0
            }}>
              {r.emoji}
            </div>
            <div>
              <div className="font-display" style={{ fontSize: '17px', color: 'var(--text-dark)' }}>{r.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '3px', lineHeight: '1.4' }}>{r.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          background: 'none', border: 'none', color: 'var(--primary-dark)',
          fontWeight: '800', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline',
          marginTop: '20px', alignSelf: 'center'
        }}
      >
        ← На головну
      </button>
    </div>
  );
}
