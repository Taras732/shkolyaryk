import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore, ChildProfile } from '@/stores/useProfileStore';
import ParentalGate from '@/components/ParentalGate';

const MASCOTS = [
  { id: 'chicken', emoji: '🐣', label: 'Коко', color: '#FFF2CC' },
  { id: 'panda', emoji: '🐼', label: 'Бамбі', color: '#E4F0EC' },
  { id: 'fox', emoji: '🦊', label: 'Ліса', color: '#FCE4D6' },
  { id: 'owl', emoji: '🦉', label: 'Софі', color: '#E2EFDA' }
];

const AGE_GROUPS = [
  { id: 'under_4', label: '🐣 Малята (до 4 р.)', mascot: 'chicken' },
  { id: '5-6', label: '🐼 Дошкільнята (5-6 р.)', mascot: 'panda' },
  { id: '6-7', label: '🦊 1 клас (6-7 р.)', mascot: 'fox' },
  { id: '7-8', label: '🦉 2 клас (7-8 р.)', mascot: 'owl' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { profiles, loading, loadProfiles, createProfile, selectProfile } = useProfileStore();

  const [isCreating, setIsCreating] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedAge, setSelectedAge] = useState<ChildProfile['age_group']>('5-6');
  const [selectedMascot, setSelectedMascot] = useState('panda');
  
  // Parental Gate state
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateAction, setGateAction] = useState<'parent_panel' | 'logout' | null>(null);

  // Load profiles on mount or when user changes
  useEffect(() => {
    loadProfiles(user?.id);
  }, [user, loadProfiles]);

  // Set default mascot when age group changes
  const handleAgeChange = (age: ChildProfile['age_group']) => {
    setSelectedAge(age);
    const ageGroupObj = AGE_GROUPS.find(a => a.id === age);
    if (ageGroupObj) {
      setSelectedMascot(ageGroupObj.mascot);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    await createProfile(
      nickname.trim(),
      selectedAge,
      selectedMascot,
      user?.id
    );

    setIsCreating(false);
    setNickname('');
    // Redirect to games hub
    navigate('/hub');
  };

  const handleSelect = (id: string) => {
    selectProfile(id);
    navigate('/hub');
  };

  const handleParentAction = (action: 'parent_panel' | 'logout') => {
    setGateAction(action);
    setIsGateOpen(true);
  };

  const handleGateSuccess = () => {
    if (gateAction === 'parent_panel') {
      navigate('/parent');
    } else if (gateAction === 'logout') {
      signOut();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'var(--primary)'
      }}>
        Завантаження профілів... 🐼
      </div>
    );
  }

  // Show profile list if there are profiles and we aren't explicitly creating
  const showList = profiles.length > 0 && !isCreating;

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
      {/* 1. PROFILE LIST VIEW */}
      {showList && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: 'var(--text-dark)',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              Хто буде грати? 🎒
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '6px' }}>
              Оберіть свій профіль дитини, щоб накопичувати зірочки!
            </p>

            {/* Profile Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              marginTop: '32px'
            }}>
              {profiles.map(p => {
                const mascot = MASCOTS.find(m => m.id === p.avatar_id);
                return (
                  <div 
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    style={{
                      background: 'var(--surface-card)',
                      border: '3px solid var(--text-dark)',
                      borderRadius: 'var(--border-radius-lg)',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 6px 0 var(--text-dark)',
                      transition: 'transform 0.1s, box-shadow 0.1s'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(4px)';
                      e.currentTarget.style.boxShadow = '0 2px 0 var(--text-dark)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 0 var(--text-dark)';
                    }}
                  >
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: mascot?.color || 'var(--surface-soft)',
                      border: '2px solid var(--text-dark)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '38px',
                      margin: '0 auto'
                    }}>
                      {mascot?.emoji || '🐣'}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-dark)', marginTop: '10px' }}>
                      {p.nickname}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ⭐ {p.total_stars} зірочок
                    </div>
                  </div>
                );
              })}

              {/* Add New Profile Card */}
              <div 
                onClick={() => setIsCreating(true)}
                style={{
                  background: 'var(--surface-soft)',
                  border: '3px dashed var(--text-muted)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '32px', color: 'var(--text-muted)' }}>➕</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Створити
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Settings Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            <button 
              onClick={() => handleParentAction('logout')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--secondary-dark)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🚪 Вийти {user ? 'з акаунту' : ''}
            </button>
            
            <button 
              onClick={() => handleParentAction('parent_panel')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Батьківська панель 📊
            </button>
          </div>
        </div>
      )}

      {/* 2. PROFILE CREATION FORM VIEW */}
      {!showList && (
        <form onSubmit={handleCreate} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header / Back */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {profiles.length > 0 && (
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '12px' }}
                >
                  ←
                </button>
              )}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-dark)' }}>
                Створити профіль дитини
              </h2>
            </div>

            {/* Avatar Selector */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                Оберіть маскота 🦊
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '10px' }}>
                {MASCOTS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMascot(m.id)}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      background: m.color,
                      border: `3px solid ${selectedMascot === m.id ? 'var(--primary)' : 'var(--text-dark)'}`,
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '32px',
                      cursor: 'pointer',
                      boxShadow: selectedMascot === m.id ? '0 0 10px rgba(108, 92, 231, 0.4)' : 'none',
                      transform: selectedMascot === m.id ? 'scale(1.05)' : 'none',
                      transition: 'transform 0.1s, border-color 0.1s'
                    }}
                  >
                    {m.emoji}
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '4px' }}>
                      {m.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                Ім'я дитини (або нікнейм)
              </label>
              <input 
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Наприклад: Данилко"
                required
                maxLength={15}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '3px solid var(--text-dark)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  marginTop: '8px'
                }}
              />
            </div>

            {/* Age Group Selector */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                Вікова група
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {AGE_GROUPS.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleAgeChange(a.id as ChildProfile['age_group'])}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      background: selectedAge === a.id ? 'var(--primary-light)' : 'var(--surface-card)',
                      color: selectedAge === a.id ? '#fff' : 'var(--text-dark)',
                      border: '3px solid var(--text-dark)',
                      borderRadius: 'var(--border-radius-sm)',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 3px 0 var(--text-dark)'
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit"
            style={{
              background: 'var(--secondary)',
              color: 'var(--text-light)',
              border: '3px solid var(--text-dark)',
              padding: '16px',
              borderRadius: 'var(--border-radius-md)',
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 var(--text-dark)',
              marginTop: '40px',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(4px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Готово, грати! 🚀
          </button>
        </form>
      )}

      {/* Parental Gate Modal */}
      <ParentalGate 
        isOpen={isGateOpen}
        onClose={() => {
          setIsGateOpen(false);
          setGateAction(null);
        }}
        onSuccess={handleGateSuccess}
      />
    </div>
  );
}
