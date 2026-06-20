import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '32px 24px',
      background: 'radial-gradient(circle at top left, #F7E6FF, #DFE6FF)',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'var(--primary)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontFamily: 'var(--font-display)',
          marginBottom: '8px'
        }}>
          Освітній Простір
        </div>
        <h1 style={{
          fontSize: '32px',
          fontFamily: 'var(--font-display)',
          fontWeight: '800',
          color: 'var(--text-dark)',
          lineHeight: '1.2',
          textShadow: '0 2px 4px rgba(108, 92, 231, 0.1)'
        }}>
          Школярик
        </h1>
      </div>

      {/* Mascot / Visual Centerpiece */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '32px 0',
        position: 'relative'
      }}>
        {/* Animated glow background */}
        <div style={{
          position: 'absolute',
          width: '180px',
          height: '180px',
          background: 'var(--primary-light)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          opacity: 0.25,
        }} />
        
        <div style={{
          width: '160px',
          height: '160px',
          background: 'var(--surface-card)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '80px',
          position: 'relative',
          zIndex: 1,
          border: '4px solid var(--primary-light)',
          transform: 'rotate(-3deg)'
        }}>
          🐼
        </div>
      </div>

      {/* Action Button & Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
          lineHeight: '1.5',
          padding: '0 16px'
        }}>
          Вітаємо у новому PWA-застосунку! Тут діти тренують шкільні навички у легкій ігровій формі.
        </div>
        
        <button 
          style={{
            background: 'var(--primary)',
            color: 'var(--text-light)',
            border: 'none',
            padding: '16px 32px',
            borderRadius: 'var(--border-radius-md)',
            fontFamily: 'var(--font-display)',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            outline: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => navigate('/auth')}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Поїхали! 🚀
        </button>
      </div>
    </div>
  );
}
