import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertTriangle, Globe, UserRound, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { isSupabaseConfigured } from '@/utils/supabase';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, error, signIn, signUp, signInWithGoogle, signInGuest, clearError } = useAuthStore();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    clearError();
    setLocalError(null);
    setInfoMsg(null);
  }, [isRegister, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!supabaseConfigured) {
      setLocalError("Конфігурацію Supabase не виявлено. Ви можете увійти як Гість!");
      return;
    }

    if (password.length < 6) {
      setLocalError("Пароль має містити щонайменше 6 символів.");
      return;
    }

    if (isRegister) {
      await signUp(email, password);
      // З увімкненим Confirm email сесія не створюється одразу — треба підтвердити пошту.
      if (!useAuthStore.getState().error) {
        setInfoMsg('Ми надіслали лист на твою пошту 📬 Підтверди email за посиланням і повертайся, щоб увійти.');
      }
    } else {
      await signIn(email, password);
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
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              cursor: 'pointer',
              color: 'var(--text-dark)'
            }}
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <span className="font-display" style={{ fontSize: '12px', color: 'var(--primary-dark)' }}>
            Школярик
          </span>
          <div style={{ width: '24px' }}></div>
        </div>

        {/* Mascot Centerpiece */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ display: 'inline-flex', animation: 'float 5s ease-in-out infinite', color: 'var(--primary)' }}>
            <Sparkles size={48} strokeWidth={1.5} />
          </span>
          <h2 className="font-display" style={{
            fontSize: '20px',
            color: 'var(--text-dark)',
            marginTop: '8px'
          }}>
            {isRegister ? 'Створити акаунт' : 'Вхід у Школярик'}
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
            marginTop: '4px',
            padding: '0 8px',
            lineHeight: '1.4',
            fontWeight: '600'
          }}>
            Створіть кабінет, щоб зберігати прогрес дитини та підключати кілька профілів учнів.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
              ЕЛЕКТРОННА ПОШТА (EMAIL)
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="input-clay"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
              ПАРОЛЬ
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-clay"
              required
            />
          </div>

          {/* Errors display */}
          {(error || localError) && (
            <div style={{
              background: '#FFE8EB',
              border: '3px solid var(--secondary)',
              color: 'var(--secondary-dark)',
              padding: '12px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              fontWeight: '800',
              lineHeight: '1.4',
              boxShadow: '0 3px 0 var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Успіх реєстрації (Confirm email увімкнено) */}
          {infoMsg && (
            <div style={{
              background: '#E9FBEF',
              border: '3px solid var(--c-green)',
              color: 'var(--c-ok-ink)',
              padding: '12px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              fontWeight: '800',
              lineHeight: '1.4',
              boxShadow: '0 3px 0 var(--border-color)'
            }}>
              {infoMsg}
            </div>
          )}

          {/* Sign In Button */}
          <button 
            type="submit"
            disabled={loading}
            className="btn-clay"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Завантаження...' : isRegister ? (<><Sparkles size={16} strokeWidth={2} /> Зареєструватися</>) : (<><KeyRound size={16} strokeWidth={2} /> Увійти в акаунт</>)}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '11px',
          margin: '20px 0',
          fontWeight: '800'
        }}>
          <div style={{ flex: 1, height: '3px', background: 'var(--border-color)', opacity: 0.15 }}></div>
          <span style={{ padding: '0 12px' }}>АБО</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--border-color)', opacity: 0.15 }}></div>
        </div>

        {/* Alternates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Google Auth */}
          <button 
            type="button"
            onClick={signInWithGoogle}
            disabled={loading || !supabaseConfigured}
            className="btn-clay secondary"
            style={{ width: '100%' }}
          >
            <Globe size={18} strokeWidth={1.75} /> Увійти через Google
          </button>

          {/* Guest Auth — явний анонімний вхід (прогрес пишеться в БД без реєстрації) */}
          <button
            type="button"
            onClick={async () => { await signInGuest(); navigate('/'); }}
            disabled={loading}
            className="btn-clay accent"
            style={{ width: '100%', marginTop: '8px' }}
          >
            <UserRound size={18} strokeWidth={1.75} /> Продовжити як Гість
          </button>
        </div>
      </div>

      {/* Switcher link */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          type="button"
          onClick={() => setIsRegister(!isRegister)}
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
          {isRegister ? 'Маєте акаунт? Увійти' : 'Немає акаунта? Зареєструватися'}
        </button>
      </div>
    </div>
  );
}
