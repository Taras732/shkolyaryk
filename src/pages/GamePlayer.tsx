import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import confetti from 'canvas-confetti';

interface Task {
  questionText: string;
  visualElement?: React.ReactNode;
  correctAnswer: string | number;
  options: (string | number)[];
}

// ----------------------------------------------------
// Grade 3 Math Procedural Task Generators
// ----------------------------------------------------

// 1. Equations Generator (Рівняння)
const generateEquationsTasks = (): Task[] => {
  const tasks: Task[] = [];
  const templates = ['x_plus_A_eq_B', 'x_minus_A_eq_B', 'A_minus_x_eq_B', 'x_mult_A_eq_B'];
  const shuffledTemplates = [...templates, templates[Math.floor(Math.random() * templates.length)]].sort(() => Math.random() - 0.5);

  const usedAnswers = new Set<number>();

  for (let i = 0; i < 5; i++) {
    const template = shuffledTemplates[i];
    let numA = 0;
    let numB = 0;
    let xValue = 0;
    let question = '';

    while (true) {
      if (template === 'x_plus_A_eq_B') {
        numA = Math.floor(Math.random() * 8) * 10 + 20; // 20, 30, ..., 90
        xValue = Math.floor(Math.random() * 8) * 10 + 20; // 20, 30, ..., 90
        numB = xValue + numA;
        question = `x + ${numA} = ${numB}`;
      } else if (template === 'x_minus_A_eq_B') {
        numA = Math.floor(Math.random() * 15) * 10 + 50; // 50-190
        xValue = Math.floor(Math.random() * 15) * 10 + 50; // 50-190
        numB = xValue - numA;
        if (numB <= 10) continue;
        question = `x − ${numA} = ${numB}`;
      } else if (template === 'A_minus_x_eq_B') {
        numA = Math.floor(Math.random() * 20) * 10 + 100; // 100-290
        xValue = Math.floor(Math.random() * 9) * 10 + 10;  // 10-90
        numB = numA - xValue;
        if (numB <= 0) continue;
        question = `${numA} − x = ${numB}`;
      } else {
        // x * A = B
        numA = Math.floor(Math.random() * 7) + 3; // 3-9
        xValue = Math.floor(Math.random() * 7) + 3; // 3-9
        numB = xValue * numA;
        question = `x × ${numA} = ${numB}`;
      }

      if (xValue > 0 && !usedAnswers.has(xValue)) {
        usedAnswers.add(xValue);
        break;
      }
    }

    // Generate decoys
    const decoys = new Set<number>();
    const isTens = template !== 'x_mult_A_eq_B';

    while (decoys.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (isTens ? 10 : 1) * (Math.floor(Math.random() * 3) + 1);
      const decoy = xValue + offset;
      if (decoy > 0 && decoy !== xValue) {
        decoys.add(decoy);
      }
    }

    const options = [xValue, ...Array.from(decoys)].sort(() => Math.random() - 0.5);

    tasks.push({
      questionText: 'Знайди значення x:',
      visualElement: (
        <div style={{
          fontSize: '34px',
          fontWeight: '800',
          fontFamily: 'var(--font-display)',
          color: 'var(--primary-dark)',
          margin: '20px 0'
        }}>
          {question}
        </div>
      ),
      correctAnswer: xValue,
      options
    });
  }
  return tasks;
};

// 2. Extra Multiplication & Division (Позатабличне множення та ділення)
const generateExtArithmeticTasks = (): Task[] => {
  const tasks: Task[] = [];
  const types = ['mult_double', 'div_double', 'mult_round', 'div_round'];
  const shuffledTypes = [...types, types[Math.floor(Math.random() * types.length)]].sort(() => Math.random() - 0.5);

  const usedAnswers = new Set<number>();

  for (let i = 0; i < 5; i++) {
    const type = shuffledTypes[i];
    let num1 = 0;
    let num2 = 0;
    let answer = 0;
    let question = '';

    while (true) {
      if (type === 'mult_double') {
        num1 = Math.floor(Math.random() * 5) + 11; // 11-15
        num2 = Math.floor(Math.random() * 5) + 3;  // 3-7
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
      } else if (type === 'div_double') {
        // Find a suitable division like 48 / 3 or 75 / 5
        const possibleDivisors = [3, 4, 5, 6];
        num2 = possibleDivisors[Math.floor(Math.random() * possibleDivisors.length)];
        answer = Math.floor(Math.random() * 6) + 12; // 12-17
        num1 = answer * num2;
        question = `${num1} ÷ ${num2} = ?`;
      } else if (type === 'mult_round') {
        num1 = (Math.floor(Math.random() * 7) + 2) * 10; // 20, 30, ..., 80
        num2 = Math.floor(Math.random() * 4) + 2; // 2-5
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
      } else {
        // div_round: e.g. 480 / 6 or 240 / 4
        num2 = Math.floor(Math.random() * 6) + 3; // 3-8
        answer = (Math.floor(Math.random() * 7) + 2) * 10; // 20-80
        num1 = answer * num2;
        question = `${num1} ÷ ${num2} = ?`;
      }

      if (answer > 0 && !usedAnswers.has(answer)) {
        usedAnswers.add(answer);
        break;
      }
    }

    const decoys = new Set<number>();
    const isTens = type === 'mult_round' || type === 'div_round';

    while (decoys.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (isTens ? 10 : 2) * (Math.floor(Math.random() * 3) + 1);
      const decoy = answer + offset;
      if (decoy > 0 && decoy !== answer) {
        decoys.add(decoy);
      }
    }

    const options = [answer, ...Array.from(decoys)].sort(() => Math.random() - 0.5);

    tasks.push({
      questionText: 'Розв\'яжи приклад:',
      visualElement: (
        <div style={{
          fontSize: '32px',
          fontWeight: '800',
          fontFamily: 'var(--font-display)',
          color: 'var(--text-dark)',
          margin: '20px 0'
        }}>
          {question}
        </div>
      ),
      correctAnswer: answer,
      options
    });
  }
  return tasks;
};

// 3. Operations to 1000 (Дії в межах 1000)
const generateOpsTo1000Tasks = (): Task[] => {
  const tasks: Task[] = [];
  const ops = ['+', '+', '-', '-', '+'].sort(() => Math.random() - 0.5);
  const usedAnswers = new Set<number>();

  for (let i = 0; i < 5; i++) {
    const op = ops[i];
    let num1 = 0;
    let num2 = 0;
    let answer = 0;

    while (true) {
      if (op === '+') {
        num1 = (Math.floor(Math.random() * 45) + 10) * 10; // 100-540
        num2 = (Math.floor(Math.random() * 35) + 10) * 10; // 100-440
        answer = num1 + num2;
      } else {
        num1 = (Math.floor(Math.random() * 60) + 30) * 10; // 300-890
        num2 = (Math.floor(Math.random() * 25) + 5) * 10;  // 50-290
        answer = num1 - num2;
      }

      if (answer > 100 && answer < 1000 && !usedAnswers.has(answer)) {
        usedAnswers.add(answer);
        break;
      }
    }

    const decoys = new Set<number>();
    while (decoys.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * 10 * (Math.floor(Math.random() * 4) + 1);
      const decoy = answer + offset;
      if (decoy > 100 && decoy !== answer) {
        decoys.add(decoy);
      }
    }
    const options = [answer, ...Array.from(decoys)].sort(() => Math.random() - 0.5);

    tasks.push({
      questionText: 'Розв\'яжи приклад:',
      visualElement: (
        <div style={{
          fontSize: '32px',
          fontWeight: '800',
          fontFamily: 'var(--font-display)',
          color: 'var(--text-dark)',
          margin: '20px 0'
        }}>
          {num1} {op} {num2} = ?
        </div>
      ),
      correctAnswer: answer,
      options
    });
  }
  return tasks;
};

// 4. Fractions & Parts (Дроби та частини)
const generateFractionsTasks = (): Task[] => {
  const tasks: Task[] = [];
  const types = ['find_part', 'find_whole', 'find_part', 'find_whole', 'find_part'].sort(() => Math.random() - 0.5);
  const usedAnswers = new Set<number>();

  for (let i = 0; i < 5; i++) {
    const type = types[i];
    let partNum = 0;
    let divisor = 0;
    let wholeNum = 0;
    let question = '';
    let visual: React.ReactNode = null;

    while (true) {
      divisor = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];

      if (type === 'find_part') {
        partNum = Math.floor(Math.random() * 7) + 2; // 2-8
        wholeNum = partNum * divisor;
        question = `Знайди 1/${divisor} від числа ${wholeNum}:`;

        // Render visual fractions representation (pizza or bars)
        visual = (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '20px 0' }}>
            {Array.from({ length: divisor }).map((_, idx) => (
              <div 
                key={idx}
                style={{
                  width: '32px',
                  height: '40px',
                  background: idx === 0 ? 'var(--primary)' : 'var(--surface-soft)',
                  border: '3px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  boxShadow: idx === 0 ? 'inset 0 -4px 0 rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
              >
                {idx === 0 ? '1' : ''}
              </div>
            ))}
          </div>
        );
        
        if (!usedAnswers.has(partNum)) {
          usedAnswers.add(partNum);
          break;
        }
      } else {
        // find_whole
        partNum = Math.floor(Math.random() * 6) + 3; // 3-8
        wholeNum = partNum * divisor;
        question = `Знайди число, якщо його 1/${divisor} дорівнює ${partNum}:`;

        visual = (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '14px 0', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{
                background: 'var(--accent)',
                border: '3px solid var(--border-color)',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                fontWeight: '800',
                fontSize: '15px'
              }}>
                Частина (1/{divisor}) = {partNum}
              </div>
            </div>
            <span style={{ fontSize: '16px' }}>👇</span>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Чому дорівнює ВСЕ число?</div>
          </div>
        );

        if (!usedAnswers.has(wholeNum)) {
          usedAnswers.add(wholeNum);
          break;
        }
      }
    }

    const answer = type === 'find_part' ? partNum : wholeNum;

    // Generate decoys
    const decoys = new Set<number>();
    while (decoys.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (divisor === 2 ? 2 : 1) * (Math.floor(Math.random() * 3) + 1);
      const decoy = answer + offset;
      if (decoy > 0 && decoy !== answer) {
        decoys.add(decoy);
      }
    }
    const options = [answer, ...Array.from(decoys)].sort(() => Math.random() - 0.5);

    tasks.push({
      questionText: question,
      visualElement: visual,
      correctAnswer: answer,
      options
    });
  }
  return tasks;
};

// ----------------------------------------------------
// Preschool (дошкільнята) Task Generators — візуальні, прості
// ----------------------------------------------------

const COUNT_EMOJI = ['🍎', '🐤', '⭐', '🎈', '🌸', '🐞', '🍓', '🐢'];
const CMP_EMOJI = ['🍎', '⭐', '🎈', '🐤'];

// П1. Лічба 1-10 (скільки об'єктів?)
const generateCountingTasks = (): Task[] => {
  const tasks: Task[] = [];
  const used = new Set<number>();
  for (let i = 0; i < 5; i++) {
    let n = 0;
    while (true) { n = Math.floor(Math.random() * 10) + 1; if (!used.has(n)) { used.add(n); break; } }
    const emoji = COUNT_EMOJI[Math.floor(Math.random() * COUNT_EMOJI.length)];
    const decoys = new Set<number>();
    while (decoys.size < 3) {
      const off = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
      const d = n + off;
      if (d > 0 && d <= 12 && d !== n) decoys.add(d);
    }
    const options = [n, ...Array.from(decoys)].sort(() => Math.random() - 0.5);
    tasks.push({
      questionText: 'Скільки тут? 🔢',
      visualElement: (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', margin: '16px auto', maxWidth: '280px' }}>
          {Array.from({ length: n }).map((_, k) => <span key={k} style={{ fontSize: '40px' }}>{emoji}</span>)}
        </div>
      ),
      correctAnswer: n,
      options
    });
  }
  return tasks;
};

// П2. Перші додавання (A+B ≤ 10, візуальні групи)
const generateFirstAdditionTasks = (): Task[] => {
  const tasks: Task[] = [];
  const used = new Set<string>();
  for (let i = 0; i < 5; i++) {
    let a = 0, b = 0;
    while (true) {
      a = Math.floor(Math.random() * 5) + 1;
      b = Math.floor(Math.random() * 4) + 1;
      if (a + b <= 10 && !used.has(a + '+' + b)) { used.add(a + '+' + b); break; }
    }
    const sum = a + b;
    const decoys = new Set<number>();
    while (decoys.size < 3) {
      const off = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
      const d = sum + off;
      if (d > 0 && d <= 14 && d !== sum) decoys.add(d);
    }
    const options = [sum, ...Array.from(decoys)].sort(() => Math.random() - 0.5);
    const grp = (n: number, e: string) => (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '110px', justifyContent: 'center' }}>
        {Array.from({ length: n }).map((_, k) => <span key={k} style={{ fontSize: '30px' }}>{e}</span>)}
      </div>
    );
    tasks.push({
      questionText: 'Скільки разом? ➕',
      visualElement: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', margin: '16px 0' }}>
          {grp(a, '🔵')}
          <span style={{ fontSize: '30px', fontWeight: 800 }}>➕</span>
          {grp(b, '🟡')}
        </div>
      ),
      correctAnswer: sum,
      options
    });
  }
  return tasks;
};

// П3. Більше-менше (де більше об'єктів?)
const generateCompareTasks = (): Task[] => {
  const tasks: Task[] = [];
  for (let i = 0; i < 5; i++) {
    let l = 0, r = 0;
    while (true) { l = Math.floor(Math.random() * 8) + 1; r = Math.floor(Math.random() * 8) + 1; if (l !== r) break; }
    const emoji = CMP_EMOJI[Math.floor(Math.random() * CMP_EMOJI.length)];
    const grp = (n: number) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center', maxWidth: '120px', padding: '10px', border: '3px solid var(--border-color)', borderRadius: '16px', background: 'var(--surface-soft)' }}>
        {Array.from({ length: n }).map((_, k) => <span key={k} style={{ fontSize: '24px' }}>{emoji}</span>)}
      </div>
    );
    tasks.push({
      questionText: 'Де більше? Обери більше число ⚖️',
      visualElement: (
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', margin: '16px 0' }}>
          {grp(l)}{grp(r)}
        </div>
      ),
      correctAnswer: Math.max(l, r),
      options: [l, r].sort(() => Math.random() - 0.5)
    });
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

  // Load specific game generator
  useEffect(() => {
    let generated: Task[] = [];
    if (gameId === 'math_equations') {
      generated = generateEquationsTasks();
    } else if (gameId === 'ext_multiplication') {
      generated = generateExtArithmeticTasks();
    } else if (gameId === 'ops_to_1000') {
      generated = generateOpsTo1000Tasks();
    } else if (gameId === 'fractions') {
      generated = generateFractionsTasks();
    } else if (gameId === 'pre_counting') {
      generated = generateCountingTasks();
    } else if (gameId === 'pre_addition') {
      generated = generateFirstAdditionTasks();
    } else if (gameId === 'pre_compare') {
      generated = generateCompareTasks();
    } else {
      generated = generateEquationsTasks();
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
        color: 'var(--primary-dark)',
        fontFamily: 'var(--font-display)',
        fontSize: '18px'
      }}>
        Завантаження гри... 🎒
      </div>
    );
  }

  const currentTask = tasks[currentTaskIdx];

  const handleAnswerSelect = (option: string | number) => {
    if (answerState !== 'idle') return;

    setSelectedOption(option);
    const isCorrect = option === currentTask.correctAnswer;

    if (isCorrect) {
      setAnswerState('correct');
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        if (currentTaskIdx < 4) {
          setCurrentTaskIdx(currentTaskIdx + 1);
          setSelectedOption(null);
          setAnswerState('idle');
        } else {
          handleGameFinish();
        }
      }, 1000);
    } else {
      setAnswerState('incorrect');
      setMistakesCount(prev => prev + 1);
      
      setTimeout(() => {
        setSelectedOption(null);
        setAnswerState('idle');
      }, 1200);
    }
  };

  const handleGameFinish = async () => {
    let stars = 3;
    if (mistakesCount === 1) stars = 2;
    else if (mistakesCount >= 2) stars = 1;

    setEarnedStars(stars);
    setGameFinished(true);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 }
    });

    if (activeProfile && gameId) {
      await updateProgress(
        activeProfile.id,
        gameId,
        2, // Next level
        stars,
        {
          timestamp: new Date().toISOString(),
          mistakes: mistakesCount
        },
        user?.id
      );
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
      {/* 1. PLAY SCREEN */}
      {!gameFinished && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Header */}
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

              {/* Progress Slider */}
              <div style={{
                flex: 1,
                margin: '0 16px',
                height: '18px',
                background: 'var(--surface-soft)',
                border: '3px solid var(--border-color)',
                borderRadius: 'var(--border-radius-full)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 3px 0 rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: `${(currentTaskIdx / 5) * 100}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  transition: 'width 0.3s ease',
                  boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.15)'
                }} />
              </div>

              <div className="font-display" style={{ fontSize: '13px' }}>
                {currentTaskIdx + 1}/5
              </div>
            </div>

            {/* mistakes tracker */}
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>
              ПОМИЛКИ: {mistakesCount}
            </div>
          </div>

          {/* Interactive Card */}
          <div 
            className="card-clay"
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              margin: '24px 0',
              animation: answerState === 'incorrect' ? 'shake 0.5s' : 'none'
            }}
          >
            <h3 style={{
              fontSize: '15px',
              fontFamily: 'var(--font-display)',
              color: 'var(--text-dark)',
              marginBottom: '10px'
            }}>
              {currentTask.questionText}
            </h3>

            {/* Visual Math Component */}
            {currentTask.visualElement}
          </div>

          {/* Answer Pad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: currentTask.options.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 2fr)',
            gap: '14px',
            marginBottom: '16px'
          }}>
            {currentTask.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              let btnClass = 'btn-clay';
              
              if (isSelected) {
                if (answerState === 'correct') {
                  btnClass = 'btn-clay success';
                } else if (answerState === 'incorrect') {
                  btnClass = 'btn-clay secondary';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(opt)}
                  disabled={answerState !== 'idle'}
                  className={btnClass}
                  style={{
                    padding: '20px 8px',
                    fontSize: '22px',
                    borderRadius: 'var(--border-radius-sm)'
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. REWARD SCREEN */}
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
            
            <h2 className="font-display" style={{
              fontSize: '22px',
              color: 'var(--text-dark)',
              marginTop: '16px'
            }}>
              Класний результат! 🎉
            </h2>
            
            <p style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '6px',
              fontWeight: '600'
            }}>
              Ви пройшли всі 5 раундів математики!
            </p>

            {/* Stars */}
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

            {/* Score Message */}
            <div className="font-display" style={{
              background: 'var(--surface-soft)',
              border: '3px solid var(--border-color)',
              padding: '10px 20px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              color: 'var(--text-dark)',
              display: 'inline-block',
              boxShadow: '0 3px 0 var(--border-color)'
            }}>
              {mistakesCount === 0 
                ? 'ПЕРФЕКТ! БЕЗ ПОМИЛОК! 🐼' 
                : mistakesCount === 1 
                  ? 'ТІЛЬКИ 1 ПОМИЛКА! ЧУДОВО! 🦊' 
                  : `ПОМИЛОК В РАУНДІ: ${mistakesCount} 🐣`
              }
            </div>
          </div>

          <button
            onClick={() => navigate('/hub')}
            className="btn-clay success"
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '16px',
              fontSize: '15px'
            }}
          >
            Продовжити навчання 🏝️
          </button>
        </div>
      )}
    </div>
  );
}
