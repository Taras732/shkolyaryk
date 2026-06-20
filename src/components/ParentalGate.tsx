import { useState, useEffect } from 'react';

interface ParentalGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ParentalGate({ isOpen, onClose, onSuccess }: ParentalGateProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operation, setOperation] = useState<'addition' | 'multiplication'>('addition');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  // Generate a random math problem suitable for adults (not children)
  const generateProblem = () => {
    const isMult = Math.random() > 0.5;
    if (isMult) {
      setOperation('multiplication');
      // e.g. 7 x 8 or 6 x 9
      setNum1(Math.floor(Math.random() * 5) + 5); // 5-9
      setNum2(Math.floor(Math.random() * 5) + 5); // 5-9
    } else {
      setOperation('addition');
      // e.g. 34 + 19
      setNum1(Math.floor(Math.random() * 50) + 20); // 20-69
      setNum2(Math.floor(Math.random() * 30) + 10); // 10-39
    }
    setAnswer('');
    setError(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateProblem();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const correctAnswer = operation === 'multiplication' ? num1 * num2 : num1 + num2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === correctAnswer) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setAnswer('');
    }
  };

  return (
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
      zIndex: 999,
      backdropFilter: 'blur(4px)',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--border-radius-lg)',
        border: '4px solid var(--text-dark)',
        boxShadow: 'var(--shadow-lg)',
        padding: '28px 20px',
        width: '100%',
        maxWidth: '340px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          ❌
        </button>

        <span style={{ fontSize: '32px' }}>🔒</span>
        
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          color: 'var(--text-dark)',
          marginTop: '12px'
        }}>
          Контроль батьків
        </h3>
        
        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginTop: '8px',
          lineHeight: '1.4'
        }}>
          Будь ласка, доведіть, що ви дорослий, розв'язавши приклад:
        </p>

        {/* Problem Display */}
        <div style={{
          fontSize: '24px',
          fontWeight: '800',
          fontFamily: 'var(--font-display)',
          background: 'var(--surface-soft)',
          border: '3px solid var(--text-dark)',
          borderRadius: 'var(--border-radius-md)',
          padding: '12px 16px',
          margin: '20px 0',
          color: 'var(--primary-dark)'
        }}>
          {operation === 'multiplication' 
            ? `${num1} × ${num2} = ?`
            : `${num1} + ${num2} = ?`
          }
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input 
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введіть число"
            autoFocus
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              textAlign: 'center',
              border: `3px solid ${error ? 'var(--secondary)' : 'var(--text-dark)'}`,
              borderRadius: 'var(--border-radius-sm)',
              outline: 'none',
              fontFamily: 'var(--font-display)',
              marginBottom: '16px'
            }}
          />

          {error && (
            <p style={{
              color: 'var(--secondary-dark)',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Неправильно! Спробуйте ще раз 🐣
            </p>
          )}

          <button 
            type="submit"
            style={{
              width: '100%',
              background: 'var(--primary)',
              color: 'var(--text-light)',
              border: '3px solid var(--text-dark)',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-display)',
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              boxShadow: '0 4px 0 var(--text-dark)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(4px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Підтвердити
          </button>
        </form>
      </div>
    </div>
  );
}
