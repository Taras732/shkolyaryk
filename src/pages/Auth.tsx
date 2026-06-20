import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { isSupabaseConfigured } from '@/utils/supabase';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, error, signIn, signUp, signInWithGoogle, clearError } = useAuthStore();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    // If user is logged in, redirect to profiles onboarding page
    if (user) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Clear errors on page mount / swap
    clearError();
    setLocalError(null);
  }, [isRegister, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!supabaseConfigured) {
      setLocalError("Supabase не налаштовано локально. Спробуйте увійти як Гість!");
      return;
    }

    if (password.length < 6) {
      setLocalError("Пароль має бути не менше 6 символів.");
      return;
    }

    if (isRegister) {
      await signUp(email, password);
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
      background: 'radial-gradient(circle at top left, #F7E6FF, #DFE6FF)',
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
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-dark)'
            }}
          >
            ←
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>
            Школярик
          </span>
          <div style={{ width: '24px' }}></div>
        </div>

        {/* Mascot Face */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '48px' }}>🐼</span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            color: 'var(--text-dark)',
            marginTop: '8px'
          }}>
            {isRegister ? 'Створити Акаунт' : 'Вхід для Батьків'}
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
            marginTop: '4px',
            padding: '0 16px',
            lineHeight: '1.4'
          }}>
            Акаунт потрібен для збереження прогресу дитини у хмарі та синхронізації між пристроями.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
              Ваша електронна адреса (Email)
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '3px solid var(--text-dark)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
              Пароль
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '3px solid var(--text-dark)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                outline: 'none'
              }}
            />
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div style={{
              background: '#FFE5E5',
              border: '2px solid var(--secondary)',
              color: 'var(--secondary-dark)',
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: '1.4'
            }}>
              ⚠️ {localError || error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--primary)',
              color: 'var(--text-light)',
              border: '3px solid var(--text-dark)',
              padding: '14px',
              borderRadius: 'var(--border-radius-sm)',
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 0 var(--text-dark)',
              marginTop: '8px',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'translateY(4px)')}
            onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Завантаження...' : isRegister ? 'Зареєструватися ✨' : 'Увійти 🔑'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '11px',
          margin: '20px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--text-muted)', opacity: 0.3 }}></div>
          <span style={{ padding: '0 10px', fontWeight: 'bold' }}>АБО</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--text-muted)', opacity: 0.3 }}></div>
        </div>

        {/* Social Login & Guest Option */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Google Sign In */}
          <button 
            type="button"
            onClick={signInWithGoogle}
            disabled={loading || !supabaseConfigured}
            style={{
              background: 'var(--surface-card)',
              color: 'var(--text-dark)',
              border: '3px solid var(--text-dark)',
              padding: '12px',
              borderRadius: 'var(--border-radius-sm)',
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: (loading || !supabaseConfigured) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 0 var(--text-dark)',
              opacity: !supabaseConfigured ? 0.6 : 1
            }}
          >
            {/* Google Icon representation */}
            <span style={{ fontSize: '18px' }}>🌐</span> Увійти через Google
          </button>

          {/* Anonymous Guest Button */}
          <button 
            type="button"
            onClick={() => navigate('/onboarding')}
            style={{
              background: 'var(--surface-soft)',
              color: 'var(--primary-dark)',
              border: '3px dashed var(--primary)',
              padding: '12px',
              borderRadius: 'var(--border-radius-sm)',
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '10px'
            }}
          >
            🐣 Продовжити як Гість (офлайн)
          </button>
        </div>
      </div>

      {/* Switch auth mode */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button 
          type="button"
          onClick={() => setIsRegister(!isRegister)}
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
          {isRegister ? 'Вже маєте акаунт? Увійти' : 'Немає акаунта? Зареєструватися'}
        </button>
      </div>
    </div>
  );
}
