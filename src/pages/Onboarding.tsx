import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import ParentalGate from '@/components/ParentalGate';

const MASCOTS = [
  { id: 'panda', emoji: '🐼', label: 'Бамбі', color: '#E4F0EC' },
  { id: 'fox', emoji: '🦊', label: 'Ліса', color: '#FCE4D6' },
  { id: 'owl', emoji: '🦉', label: 'Софі', color: '#E2EFDA' },
  { id: 'chicken', emoji: '🐣', label: 'Коко', color: '#FFF2CC' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { profiles, loading, loadProfiles, createProfile, selectProfile } = useProfileStore();

  const [isCreating, setIsCreating] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedMascot, setSelectedMascot] = useState('panda');
  
  // Parental Gate State
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateAction, setGateAction] = useState<'parent_panel' | 'logout' | null>(null);

  useEffect(() => {
    loadProfiles(user?.id);
  }, [user, loadProfiles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    // Hardcode age group as '7-8' (equivalent to Grade 3)
    await createProfile(
      nickname.trim(),
      '7-8',
      selectedMascot,
      user?.id
    );

    setIsCreating(false);
    setNickname('');
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
        fontSize: '20px',
        fontFamily: 'var(--font-display)',
        fontWeight: 'bold',
        color: 'var(--primary-dark)'
      }}>
        Завантаження... 🐼
      </div>
    );
  }

  const showList = profiles.length > 0 && !isCreating;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 30%, #F5F1FF 0%, #E8E2FF 100%)',
      overflowY: 'auto'
    }}>
      {/* 1. LIST OF PROFILES */}
      {showList && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-display" style={{
              fontSize: '20px',
              color: 'var(--text-dark)',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              Хто навчається? 🎓
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '6px', fontWeight: '600' }}>
              Оберіть профіль учня, щоб продовжити заняття!
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
                    className="card-clay"
                    style={{
                      padding: '20px 16px',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '50%',
                      background: mascot?.color || 'var(--surface-soft)',
                      border: '3px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '40px',
                      margin: '0 auto',
                      boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.1)'
                    }}>
                      {mascot?.emoji || '🐣'}
                    </div>
                    <div className="font-display" style={{ fontSize: '14px', color: 'var(--text-dark)', marginTop: '12px' }}>
                      {p.nickname}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-dark)', fontWeight: '800', marginTop: '4px' }}>
                      3-й Клас 🎒
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 'bold' }}>
                      ⭐ {p.total_stars} зірочок
                    </div>
                  </div>
                );
              })}

              {/* Create Profile Card */}
              <div 
                onClick={() => setIsCreating(true)}
                style={{
                  background: 'var(--surface-soft)',
                  border: '3px dashed var(--text-muted)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: 'inset 0 4px 0 rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ fontSize: '36px', color: 'var(--text-muted)' }}>➕</div>
                <div className="font-display" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  НОВИЙ УЧЕНЬ
                </div>
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            <button 
              type="button"
              onClick={() => handleParentAction('logout')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--secondary-dark)',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              🚪 Вийти з кабінету
            </button>
            
            <button 
              type="button"
              onClick={() => handleParentAction('parent_panel')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-dark)',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              Батьківська панель ⚙️
            </button>
          </div>
        </div>
      )}

      {/* 2. CREATE NEW PROFILE */}
      {!showList && (
        <form onSubmit={handleCreate} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header */}
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
              <h2 className="font-display" style={{ fontSize: '18px', color: 'var(--text-dark)' }}>
                Створити профіль учня
              </h2>
            </div>

            {/* Mascot Selection */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                ОБЕРІТЬ МАСКОТА-ПОМІЧНИКА
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' }}>
                {MASCOTS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMascot(m.id)}
                    style={{
                      flex: 1,
                      padding: '16px 8px',
                      background: m.color,
                      border: `3px solid ${selectedMascot === m.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '36px',
                      cursor: 'pointer',
                      boxShadow: selectedMascot === m.id 
                        ? '0 6px 0 var(--border-color), 0 0 10px rgba(108, 92, 231, 0.3)' 
                        : '0 4px 0 var(--border-color)',
                      transform: selectedMascot === m.id ? 'translateY(-2px)' : 'none',
                      transition: 'transform 0.1s, border-color 0.1s'
                    }}
                  >
                    {m.emoji}
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>
                      {m.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname input */}
            <div style={{ marginTop: '28px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                ІМ'Я УЧНЯ (НІКНЕЙМ)
              </label>
              <input 
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Наприклад: Данилко"
                className="input-clay"
                required
                maxLength={12}
                style={{ marginTop: '8px' }}
              />
            </div>

            {/* Grade confirmation */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}>
                НАВЧАЛЬНА ПРОГРАМА
              </label>
              <div style={{
                background: 'var(--surface-soft)',
                border: '3px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '16px',
                fontWeight: 'bold',
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px',
                boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.05)'
              }}>
                <span style={{ fontSize: '28px' }}>🎒</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800' }}>3-й клас Математика</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Нова Українська Школа (НУШ)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit"
            className="btn-clay success"
            style={{ width: '100%', marginTop: '32px', padding: '16px' }}
          >
            Створити та грати! 🚀
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
