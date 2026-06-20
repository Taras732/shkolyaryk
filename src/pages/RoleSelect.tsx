import { useNavigate } from 'react-router-dom';

const ROLES = [
  {
    id: 'student',
    emoji: '🧒',
    title: 'Я учень',
    sub: 'Грати, вчитися й рости разом із другом-помічником!',
    color: '#EAF6FF',
    border: '#3B9EF0',
    to: '/onboarding'
  },
  {
    id: 'parent',
    emoji: '👨‍👩‍👧',
    title: 'Батьки',
    sub: 'Бачити прогрес дитини й керувати профілями.',
    color: '#EAFBF0',
    border: '#22C55E',
    to: '/parent'
  },
  {
    id: 'teacher',
    emoji: '👩‍🏫',
    title: 'Вчитель',
    sub: 'Клас, завдання та успіхи учнів (скоро).',
    color: '#F3EEFF',
    border: '#6C5CE7',
    to: '/parent'
  }
];

export default function RoleSelect() {
  const navigate = useNavigate();

  const pick = (role: typeof ROLES[number]) => {
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
            className="card-clay"
            style={{
              background: r.color,
              borderColor: r.border,
              borderWidth: '3px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '18px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: '#fff',
              border: `3px solid ${r.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              flexShrink: 0,
              boxShadow: '0 4px 0 rgba(0,0,0,0.12)'
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
