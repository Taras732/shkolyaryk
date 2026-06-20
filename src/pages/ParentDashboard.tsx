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
      background: 'radial-gradient(circle at 50% 30%, #F5F1FF 0%, #E8E2FF 100%)',
      overflowY: 'auto'
    }}>
      <div>
        {/* Navigation */}
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
          <span className="font-display" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
            КАБІНЕТ БАТЬКІВ 📊
          </span>
          <div style={{ width: '24px' }}></div>
        </div>

        {/* Parent Details Card */}
        <div className="card-clay" style={{ marginTop: '24px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
            ОБЛІКОВИЙ ЗАПИС
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', wordBreak: 'break-all' }}>
            {user ? user.email : 'Гість (Офлайн-режим)'}
          </div>
        </div>

        {/* Child Profiles Manager */}
        <div style={{ marginTop: '28px' }}>
          <div className="font-display" style={{ fontSize: '11px', color: 'var(--text-dark)', marginBottom: '12px' }}>
            УЧНІ ({profiles.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profiles.map(p => (
              <div 
                key={p.id}
                className="card-clay"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-dark)' }}>
                    {p.nickname}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
                    3-й Клас · ⭐ {p.total_stars} зірочок
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setTargetProfileId(p.id);
                    setConfirmDeleteType('profile');
                  }}
                  style={{
                    background: 'var(--secondary-light)',
                    border: '2px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 2px 0 var(--border-color)'
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
                border: '3px dashed var(--text-muted)',
                borderRadius: 'var(--border-radius-md)'
              }}>
                Немає зареєстрованих учнів.
              </div>
            )}
          </div>
        </div>

        {/* GDPR settings */}
        {user && (
          <div style={{
            marginTop: '32px',
            background: 'rgba(255, 107, 107, 0.08)',
            border: '3px solid var(--secondary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '18px',
            boxShadow: '0 4px 0 var(--border-color)'
          }}>
            <h4 className="font-display" style={{
              fontSize: '12px',
              color: 'var(--secondary-dark)'
            }}>
              Конфіденційність (GDPR)
            </h4>
            <p style={{
              fontSize: '11px',
              color: 'var(--text-dark)',
              lineHeight: '1.5',
              marginTop: '8px',
              fontWeight: '600'
            }}>
              Ви маєте право безповоротно видалити свій обліковий запис. При видаленні акаунта всі профілі дітей та результати навчання будуть автоматично видалені з наших серверів.
            </p>

            <button 
              onClick={() => setConfirmDeleteType('account')}
              className="btn-clay secondary"
              style={{
                marginTop: '14px',
                padding: '8px 16px',
                fontSize: '11px',
                borderRadius: 'var(--border-radius-sm)'
              }}
            >
              Видалити мій акаунт
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      <button 
        onClick={() => navigate('/onboarding')}
        className="btn-clay"
        style={{ width: '100%', marginTop: '32px' }}
      >
        Повернутися до гравців
      </button>

      {/* Confirmation Dialogs */}
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
          <div className="card-clay" style={{
            background: '#fff',
            padding: '24px 20px',
            width: '100%',
            maxWidth: '320px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '36px' }}>⚠️</span>
            
            <h3 className="font-display" style={{
              fontSize: '15px',
              color: 'var(--text-dark)',
              marginTop: '8px'
            }}>
              {confirmDeleteType === 'account' ? 'ВИДАЛИТИ АКАУНТ?' : 'ВИДАЛИТИ ПРОФІЛЬ?'}
            </h3>
            
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '8px',
              lineHeight: '1.5',
              fontWeight: '600'
            }}>
              {confirmDeleteType === 'account' 
                ? 'Ця дія є остаточною. Усі накопичені зірочки та профілі ваших дітей будуть безповоротно видалені!'
                : 'Прогрес та ігрова статистика учня будуть назавжди стерті.'
              }
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  setConfirmDeleteType('none');
                  setTargetProfileId(null);
                }}
                className="btn-clay"
                style={{
                  flex: 1,
                  background: 'var(--surface-soft)',
                  color: 'var(--text-dark)',
                  padding: '10px'
                }}
              >
                Ні
              </button>
              
              <button 
                onClick={confirmDeleteType === 'account' ? handleDeleteAccount : handleDeleteProfile}
                disabled={authLoading}
                className="btn-clay secondary"
                style={{
                  flex: 1,
                  padding: '10px'
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
