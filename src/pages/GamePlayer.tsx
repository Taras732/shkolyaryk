import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import confetti from 'canvas-confetti';

// ----------------------------------------------------
// Game Types & Helper Interfaces
// ----------------------------------------------------
interface Task {
  questionText: string;
  visualElement?: React.ReactNode;
  correctAnswer: string | number;
  options: (string | number)[];
}

const ITEMS_POOL = ['🍎', '🐱', '🐦', '🌸', '🎈', '🍊', '🚗', '🚀', '🦕', '🍩'];

// ----------------------------------------------------
// Procedural Game Generators (with Anti-Monotony System)
// ----------------------------------------------------

// 1. Counting Objects Generator (Age group < 4)
const generateCountingTasks = (): Task[] => {
  const tasks: Task[] = [];
  // Select 5 distinct answers from 1 to 5
  const numbers = [1, 2, 3, 4, 5];
  // Shuffle numbers to ensure no repeats
  const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
  // Shuffle items pool
  const items = [...ITEMS_POOL].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 5; i++) {
    const target = shuffledNumbers[i];
    const item = items[i % items.length];
    
    // Generate options in range 1-5
    const options = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

    tasks.push({
      questionText: `Скільки тут ${item}?`,
      visualElement: (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '42px', minHeight: '60px', margin: '16px 0' }}>
          {Array.from({ length: target }).map((_, idx) => (
            <span key={idx} style={{ animation: 'bounce 0.5s ease infinite alternate' }}>{item}</span>
          ))}
        </div>
      ),
      correctAnswer: target,
      options
    });
  }
  return tasks;
};

// 2. Number Comparison Generator (Age group 5-6)
const generateComparisonTasks = (): Task[] => {
  const tasks: Task[] = [];
  const usedPairs = new Set<string>();

  while (tasks.length < 5) {
    const n1 = Math.floor(Math.random() * 9) + 1; // 1-9
    const n2 = Math.floor(Math.random() * 9) + 1; // 1-9
    const pairKey = `${n1}_${n2}`;

    if (!usedPairs.has(pairKey)) {
      usedPairs.add(pairKey);
      
      let correct: string;
      if (n1 > n2) correct = '>';
      else if (n1 < n2) correct = '<';
      else correct = '=';

      tasks.push({
        questionText: `Порівняй числа:`,
        visualElement: (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', fontSize: '36px', fontWeight: '800', fontFamily: 'var(--font-display)', margin: '20px 0' }}>
            <span style={{ color: 'var(--primary-dark)', background: 'var(--surface-soft)', padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '2px solid var(--text-dark)' }}>{n1}</span>
            <span style={{ color: 'var(--secondary)' }}>?</span>
            <span style={{ color: 'var(--primary-dark)', background: 'var(--surface-soft)', padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '2px solid var(--text-dark)' }}>{n2}</span>
          </div>
        ),
        correctAnswer: correct,
        options: ['<', '=', '>']
      });
    }
  }
  return tasks;
};

// 3. Math Slalom (Addition / Subtraction, Age group 6-7)
const generateSlalomTasks = (): Task[] => {
  const tasks: Task[] = [];
  const usedAnswers = new Set<number>();
  
  // Guarantee mix: 3 addition, 2 subtraction
  const ops = ['+', '+', '+', '-', '-'].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 5; i++) {
    const op = ops[i];
    let num1 = 0;
    let num2 = 0;
    let answer = 0;

    // Retry until we get a distinct positive answer <= 20
    while (true) {
      if (op === '+') {
        num1 = Math.floor(Math.random() * 12) + 2; // 2-13
        num2 = Math.floor(Math.random() * 7) + 1;  // 1-7
        answer = num1 + num2;
      } else {
        num1 = Math.floor(Math.random() * 12) + 8; // 8-19
        num2 = Math.floor(Math.random() * 6) + 2;  // 2-7
        answer = num1 - num2;
      }

      if (answer > 0 && answer <= 20 && !usedAnswers.has(answer)) {
        usedAnswers.add(answer);
        break;
      }
    }

    // Generate decoys close to the correct answer
    const decoys = new Set<number>();
    while (decoys.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
      const decoy = answer + offset;
      if (decoy > 0 && decoy !== answer) {
        decoys.add(decoy);
      }
    }
    const options = [answer, ...Array.from(decoys)].sort(() => Math.random() - 0.5);

    tasks.push({
      questionText: 'Розв\'яжи приклад:',
      visualElement: (
        <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-dark)', margin: '20px 0' }}>
          {num1} {op === '+' ? '+' : '−'} {num2} = ?
        </div>
      ),
      correctAnswer: answer,
      options
    });
  }
  return tasks;
};

// 4. Multiplication Table (Age group 7-8)
const generateMultiplicationTasks = (): Task[] => {
  const tasks: Task[] = [];
  const usedPairs = new Set<string>();

  while (tasks.length < 5) {
    const num1 = Math.floor(Math.random() * 8) + 2; // 2-9
    const num2 = Math.floor(Math.random() * 8) + 2; // 2-9
    const pairKey = `${num1}_${num2}`;

    if (!usedPairs.has(pairKey)) {
      usedPairs.add(pairKey);
      const answer = num1 * num2;

      // Generate decoys
      const decoys = new Set<number>();
      while (decoys.size < 3) {
        const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 4) + 1);
        const decoy = answer + offset;
        if (decoy > 0 && decoy !== answer) {
          decoys.add(decoy);
        }
      }
      const options = [answer, ...Array.from(decoys)].sort(() => Math.random() - 0.5);

      tasks.push({
        questionText: 'Помнож числа:',
        visualElement: (
          <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-dark)', margin: '20px 0' }}>
            {num1} × {num2} = ?
          </div>
        ),
        correctAnswer: answer,
        options
      });
    }
  }
  return tasks;
};

export default function GamePlayer() {
  const navigate = useNavigate();
  const { id: gameId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { activeProfile, updateProgress } = useProfileStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [gameFinished, setGameFinished] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  // Initialize tasks
  useEffect(() => {
    let generated: Task[] = [];
    if (gameId === 'count_objects') {
      generated = generateCountingTasks();
    } else if (gameId === 'number_comparison') {
      generated = generateComparisonTasks();
    } else if (gameId === 'math_slalom') {
      generated = generateSlalomTasks();
    } else if (gameId === 'multiplication_table') {
      generated = generateMultiplicationTasks();
    } else {
      generated = generateCountingTasks();
    }
    setTasks(generated);
  }, [gameId]);

  if (tasks.length === 0 || !activeProfile) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        color: 'var(--primary)'
      }}>
        Готуємо гру... 🏝️
      </div>
    );
  }

  const currentTask = tasks[currentTaskIdx];

  const handleAnswerSelect = (option: string | number) => {
    if (answerState !== 'idle') return; // block multiple fast clicks

    setSelectedOption(option);
    const isCorrect = option === currentTask.correctAnswer;

    if (isCorrect) {
      setAnswerState('correct');
      // Bouncy animation sound placeholder
      
      // Trigger instant task success confetti burst
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        if (currentTaskIdx < 4) {
          setCurrentTaskIdx(currentTaskIdx + 1);
          setSelectedOption(null);
          setAnswerState('idle');
        } else {
          // Game Completed!
          handleGameFinish();
        }
      }, 1000);
    } else {
      setAnswerState('incorrect');
      setMistakesCount(prev => prev + 1);
      
      // Reset state after a short shake delay
      setTimeout(() => {
        setSelectedOption(null);
        setAnswerState('idle');
      }, 1200);
    }
  };

  const handleGameFinish = async () => {
    // Score Stars:
    // 0 mistakes = 3 stars, 1 mistake = 2 stars, 2+ mistakes = 1 star
    let stars = 3;
    if (mistakesCount === 1) stars = 2;
    else if (mistakesCount >= 2) stars = 1;

    setEarnedStars(stars);
    setGameFinished(true);

    // High-energy confetti explosion
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 }
    });

    // Save Progress in local store
    if (activeProfile && gameId) {
      await updateProgress(
        activeProfile.id,
        gameId,
        2, // next level
        stars,
        {
          timestamp: new Date().toISOString(),
          mistakes: mistakesCount
        },
        user?.id
      );
    }
  };

  // Render Game Workspace
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
      {/* 1. REGULAR GAME WORKSPACE */}
      {!gameFinished && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Header Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => navigate('/hub')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-dark)'
                }}
              >
                ❌
              </button>

              {/* Progress Indicator */}
              <div style={{
                flex: 1,
                margin: '0 16px',
                height: '16px',
                background: 'var(--surface-soft)',
                border: '2px solid var(--text-dark)',
                borderRadius: 'var(--border-radius-full)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${(currentTaskIdx / 5) * 100}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
                {currentTaskIdx + 1}/5
              </div>
            </div>

            {/* Hint message / mistakes tracker */}
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Помилок: {mistakesCount}
            </div>
          </div>

          {/* Game Task Card */}
          <div style={{
            background: 'var(--surface-card)',
            border: '4px solid var(--text-dark)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '28px 16px',
            textAlign: 'center',
            boxShadow: '0 8px 0 var(--text-dark)',
            margin: '24px 0',
            position: 'relative',
            animation: answerState === 'incorrect' ? 'shake 0.5s' : 'none'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontFamily: 'var(--font-display)',
              color: 'var(--text-dark)',
              marginBottom: '12px'
            }}>
              {currentTask.questionText}
            </h3>

            {/* Dynamic visual element representing tasks */}
            {currentTask.visualElement}
          </div>

          {/* Option Selection Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: currentTask.options.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 2fr)',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {currentTask.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              let btnBg = 'var(--surface-card)';
              let btnBorderColor = 'var(--text-dark)';
              
              if (isSelected) {
                if (answerState === 'correct') {
                  btnBg = '#D5F3E9'; // green success
                  btnBorderColor = '#2EC4B6';
                } else if (answerState === 'incorrect') {
                  btnBg = '#FFE8EB'; // red fail
                  btnBorderColor = 'var(--secondary)';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(opt)}
                  disabled={answerState !== 'idle'}
                  style={{
                    background: btnBg,
                    color: 'var(--text-dark)',
                    border: `3px solid ${btnBorderColor}`,
                    borderRadius: 'var(--border-radius-md)',
                    padding: '20px 10px',
                    fontSize: '24px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-display)',
                    cursor: answerState !== 'idle' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 0 var(--text-dark)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => answerState === 'idle' && (e.currentTarget.style.transform = 'translateY(4px)')}
                  onMouseUp={(e) => answerState === 'idle' && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. REWARD/COMPLETION VIEW */}
      {gameFinished && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 0'
        }}>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '80px', display: 'block', animation: 'bounce 0.5s infinite alternate' }}>🏆</span>
            
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              color: 'var(--text-dark)',
              marginTop: '16px'
            }}>
              Чудова гра! 🎉
            </h2>
            
            <p style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '8px'
            }}>
              Ви виконали всі завдання та отримали зірочки!
            </p>

            {/* Stars rendering */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              margin: '24px 0',
              fontSize: '48px'
            }}>
              {[1, 2, 3].map(starNum => (
                <span 
                  key={starNum}
                  style={{
                    animation: starNum <= earnedStars ? `pulse 1s infinite alternate ${starNum * 0.2}s` : 'none',
                    filter: starNum <= earnedStars ? 'none' : 'grayscale(100%) opacity(20%)'
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>

            {/* Mistakes summary */}
            <div style={{
              background: 'var(--surface-soft)',
              border: '2px solid var(--text-dark)',
              padding: '10px 20px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--text-dark)',
              display: 'inline-block'
            }}>
              {mistakesCount === 0 
                ? 'Ідеально! Без помилок! 🐼' 
                : mistakesCount === 1 
                  ? 'Всього 1 помилка! Круто! 🦊' 
                  : `Зроблено помилок: ${mistakesCount} 🐣`
              }
            </div>
          </div>

          {/* Action button to return */}
          <button
            onClick={() => navigate('/hub')}
            style={{
              width: '100%',
              maxWidth: '300px',
              background: 'var(--primary)',
              color: '#fff',
              border: '3px solid var(--text-dark)',
              padding: '16px',
              borderRadius: 'var(--border-radius-md)',
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 var(--text-dark)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(4px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Продовжити 🏝️
          </button>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
        @keyframes pulse {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px) rotate(-1deg); }
          75% { transform: translateX(6px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
