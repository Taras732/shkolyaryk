import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, deleteAccount, loading: authLoading } = useAuthStore();
  const { profiles, deleteProfile } = useProfileStore();

  const [confirmDeleteType, setConfirmDeleteType] = useState<'none' | 'account' | 'profile'>('none');
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigate('/');
  };

  const handleDeleteProfile = async () => {
    if (targetProfileId) {
      await deleteProfile(targetProfileId, user?.id);
      setConfirmDeleteType('none');
      setTargetProfileId(null);
    }
  };

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
      <div>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/onboarding')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-dark)'
            }}
          >
            ←
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
            Панель Батьків 📊
          </span>
          <div style={{ width: '24px' }}></div>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          color: 'var(--text-dark)',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          Керування профілями
        </h3>

        {/* Account Info */}
        <div style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--border-radius-md)',
          border: '3px solid var(--text-dark)',
          padding: '16px',
          marginTop: '16px',
          boxShadow: '0 4px 0 var(--text-dark)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Поточний акаунт
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '4px', wordBreak: 'break-all' }}>
            {user ? user.email : 'Гість (Офлайн-режим)'}
          </div>
        </div>

        {/* Child Profiles List */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '10px' }}>
            Профілі дітей ({profiles.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profiles.map(p => (
              <div 
                key={p.id}
                style={{
                  background: 'var(--surface-card)',
                  border: '3px solid var(--text-dark)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 0 var(--text-dark)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-dark)' }}>
                    {p.nickname}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Вік: {p.age_group === 'under_4' ? 'до 4 років' : p.age_group === '5-6' ? '5-6 років' : p.age_group === '6-7' ? '6-7 років' : '7-8 років'} · ⭐ {p.total_stars} зірок
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setTargetProfileId(p.id);
                    setConfirmDeleteType('profile');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}

            {profiles.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
                padding: '24px',
                border: '2px dashed var(--text-muted)',
                borderRadius: 'var(--border-radius-md)'
              }}>
                Немає створених профілів дитини.
              </div>
            )}
          </div>
        </div>

        {/* GDPR Compliance & Deletion */}
        {user && (
          <div style={{
            marginTop: '32px',
            background: 'rgba(255, 110, 199, 0.1)',
            border: '3px solid var(--secondary-dark)',
            borderRadius: 'var(--border-radius-md)',
            padding: '16px',
            boxShadow: '0 4px 0 var(--secondary-dark)'
          }}>
            <h4 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              color: 'var(--secondary-dark)',
              fontWeight: 'bold'
            }}>
              Конфіденційність (GDPR)
            </h4>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-dark)',
              lineHeight: '1.4',
              marginTop: '6px'
            }}>
              Ви можете видалити свій акаунт. Усі профілі дітей та їхні ігрові результати будуть повністю та назавжди стерті з наших серверів.
            </p>

            <button 
              onClick={() => setConfirmDeleteType('account')}
              style={{
                marginTop: '12px',
                background: 'var(--secondary)',
                color: 'var(--text-light)',
                border: '2px solid var(--text-dark)',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)'
              }}
            >
              Видалити мій акаунт
            </button>
          </div>
        )}
      </div>

      {/* Footer Exit */}
      <button 
        onClick={() => navigate('/onboarding')}
        style={{
          background: 'var(--text-dark)',
          color: '#fff',
          border: 'none',
          padding: '14px',
          borderRadius: 'var(--border-radius-sm)',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '32px'
        }}
      >
        Повернутись до вибору гравців
      </button>

      {/* Confirmation Dialogs Overlay */}
      {confirmDeleteType !== 'none' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(31, 27, 58, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '24px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--border-radius-lg)',
            border: '4px solid var(--text-dark)',
            padding: '24px 20px',
            width: '100%',
            maxWidth: '320px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              color: 'var(--text-dark)',
              marginTop: '8px'
            }}>
              {confirmDeleteType === 'account' ? 'Видалити весь акаунт?' : 'Видалити цей профіль?'}
            </h3>
            
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '8px',
              lineHeight: '1.4'
            }}>
              {confirmDeleteType === 'account' 
                ? 'Ця дія є остаточною. Усі профілі ваших дітей та їхній прогрес буде назавжди стерто!'
                : 'Прогрес та зірочки цієї дитини будуть безповоротно втрачені.'
              }
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  setConfirmDeleteType('none');
                  setTargetProfileId(null);
                }}
                style={{
                  flex: 1,
                  background: 'var(--surface-soft)',
                  border: '3px solid var(--text-dark)',
                  padding: '10px',
                  borderRadius: 'var(--border-radius-sm)',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Скасувати
              </button>
              
              <button 
                onClick={confirmDeleteType === 'account' ? handleDeleteAccount : handleDeleteProfile}
                disabled={authLoading}
                style={{
                  flex: 1,
                  background: 'var(--secondary)',
                  color: '#fff',
                  border: '3px solid var(--text-dark)',
                  padding: '10px',
                  borderRadius: 'var(--border-radius-sm)',
                  fontWeight: 'bold',
                  cursor: authLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {authLoading ? 'Видалення...' : 'Так, видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
