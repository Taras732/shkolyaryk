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
      background: 'linear-gradient(180deg, #DCE8FF 0%, #ECE6FF 52%, #FCEAF2 100%)',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* фон-світ: м'який пагорб-«земля» */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '200px',
        background: 'radial-gradient(150% 120% at 50% 145%, #BCEFCF 0%, #CFefdb 48%, transparent 74%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      {/* м'яке сонячне сяйво за героєм */}
      <div style={{
        position: 'absolute', top: '34%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,213,90,0.35) 0%, rgba(255,213,90,0) 65%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
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
        {/* Hero creature */}
        <div style={{
          width: '230px',
          height: '230px',
          position: 'relative',
          animation: 'float 6s ease-in-out infinite',
          filter: 'drop-shadow(0 16px 20px rgba(31,27,58,0.25))'
        }}>
          <img src="/creatures/hero_dragon.png" alt="Друг-помічник" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
