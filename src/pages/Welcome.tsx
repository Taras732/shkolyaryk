import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '36px 24px',
      background: 'radial-gradient(circle at 50% 30%, #F5F1FF 0%, #E8E2FF 100%)',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Decorative floating background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '8%',
        fontSize: '28px',
        opacity: 0.25,
        animation: 'float 4s ease-in-out infinite'
      }}>➕</div>
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '10%',
        fontSize: '32px',
        opacity: 0.25,
        animation: 'float 5s ease-in-out infinite 1s'
      }}>➗</div>
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: '12%',
        fontSize: '24px',
        opacity: 0.25,
        animation: 'float 4.5s ease-in-out infinite 0.5s'
      }}>✖️</div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: '16px', zIndex: 1 }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          color: 'var(--primary-dark)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontFamily: 'var(--font-display)',
          background: 'rgba(108, 92, 231, 0.1)',
          padding: '6px 12px',
          borderRadius: 'var(--border-radius-full)',
          border: '2px solid rgba(108, 92, 231, 0.2)'
        }}>
          Розвивальний Простір
        </span>
        <h1 className="font-display" style={{
          fontSize: '36px',
          color: 'var(--text-dark)',
          lineHeight: '1.2',
          marginTop: '16px',
          letterSpacing: '-1px'
        }}>
          Школярик
        </h1>
      </div>

      {/* Mascot Mascot Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '24px 0',
        zIndex: 1
      }}>
        {/* Animated 3D Mascot Frame */}
        <div style={{
          width: '180px',
          height: '180px',
          background: '#FFEAA7',
          borderRadius: 'var(--border-radius-lg)',
          border: 'var(--border-width) solid var(--border-color)',
          boxShadow: 'var(--shadow-3d-md)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '90px',
          position: 'relative',
          transform: 'rotate(-4deg)',
          animation: 'float 6s ease-in-out infinite',
          cursor: 'pointer'
        }}>
          🐼
          <div style={{
            position: 'absolute',
            bottom: '-12px',
            right: '-12px',
            background: 'var(--secondary)',
            color: '#fff',
            border: '3px solid var(--border-color)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '22px',
            boxShadow: '0 3px 0 var(--border-color)'
          }}>
            ✏️
          </div>
        </div>
      </div>

      {/* Bottom Info & CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1 }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-dark)',
          fontSize: '15px',
          lineHeight: '1.6',
          padding: '0 12px',
          fontWeight: '600'
        }}>
          Граємося та вчимо математику! Прогресивні завдання для учнів <span style={{ color: 'var(--primary-dark)', fontWeight: '800' }}>3-го класу</span> за програмою НУШ.
        </div>
        
        <button 
          className="btn-clay success"
          style={{
            fontSize: '16px',
            padding: '18px 24px',
            borderRadius: 'var(--border-radius-md)'
          }}
          onClick={() => navigate('/auth')}
        >
          Увійти та грати! 🚀
        </button>
      </div>
    </div>
  );
}
