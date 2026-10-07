import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { profileClass } from '@/games/registry';
import { AREA_TITLE, buildCheck, loadChecks, monthOf, saveCheck, score, type Area, type CheckQuestion } from '@/school/monthly-check';
import { scheduleFamilySync } from '@/school/family-sync-run';

/** Перевірка місяця: питання одне за одним, без «правильно/ні» — наприкінці результат по областях. */
export default function Check() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeProfile, loadProfiles } = useProfileStore();
  const [questions, setQuestions] = useState<CheckQuestion[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (!activeProfile) loadProfiles(user?.id);
  }, [activeProfile, user, loadProfiles]);
  useEffect(() => {
    if (activeProfile && !questions) setQuestions(buildCheck(profileClass(activeProfile)));
  }, [activeProfile, questions]);

  if (!activeProfile || !questions) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-mut)', fontWeight: 800 }}>Завантаження…</div>;

  const i = answers.length;
  const finished = i >= questions.length;
  const earlier = loadChecks(activeProfile.id).filter((r) => r.month !== monthOf(Date.now()));
  const prev = earlier[earlier.length - 1];

  const answer = (a: string) => {
    const next = [...answers, a];
    setAnswers(next);
    if (next.length === questions.length) {
      saveCheck(activeProfile.id, { month: monthOf(Date.now()), at: Date.now(), scores: score(questions, next) });
      scheduleFamilySync(500);
    }
  };

  const top = (
    <div className="g-topbar">
      <button className="g-iconbtn" aria-label="Назад" onClick={() => navigate(-1)}>
        ←
      </button>
      <div className="g-progress">
        <span style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>
      <div className="g-count">
        {Math.min(i + 1, questions.length)}/{questions.length}
      </div>
    </div>
  );

  if (finished) {
    const s = score(questions, answers);
    return (
      <div className="g-screen">
        <div className="play-col">
          {top}
          <div className="g-scroll">
            <div className="g-card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 44 }}>🧭</div>
              <div style={{ fontWeight: 900, fontSize: 19, color: 'var(--c-ink)' }}>Перевірку пройдено! Дякую 💛</div>
            </div>
            <div className="g-card" style={{ textAlign: 'left' }}>
              {(Object.entries(s) as [Area, { c: number; t: number }][]).map(([area, v]) => {
                const pct = Math.round((v.c / v.t) * 100);
                const was = prev?.scores[area];
                const wasPct = was ? Math.round((was.c / was.t) * 100) : null;
                return (
                  <div key={area} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--c-ink)' }}>
                      <span>{AREA_TITLE[area]}</span>
                      <span>
                        {v.c} з {v.t}
                        {wasPct !== null && (
                          <span style={{ color: pct >= wasPct ? 'var(--c-ok-ink)' : 'var(--c-warn-ink)', marginLeft: 6 }}>
                            {pct > wasPct ? `▲ ${pct - wasPct}%` : pct < wasPct ? `▼ ${wasPct - pct}%` : '='}
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--c-line)', marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--c-green)' : pct >= 60 ? '#EAB308' : '#F97316' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="g-btn primary" style={{ marginTop: 14 }} onClick={() => navigate('/after-school')}>
              До «Після школи» →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div className="g-screen">
      <div className="play-col">
        {top}
        <div className="g-scroll">
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 6 }}>🧭 Перевірка місяця · {AREA_TITLE[q.area]}</div>
          <div className="g-card" style={{ marginBottom: 14 }}>
            {q.big && <div style={{ fontSize: q.big.length > 4 ? 30 : 64, lineHeight: 1.2, marginBottom: 6, wordBreak: 'break-all' }}>{q.big}</div>}
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>{q.prompt}</div>
          </div>
          <div className="g-choices" style={{ ['--g-cols' as string]: 2 }}>
            {q.options.map((o) => (
              <button key={o} className="g-choice" onClick={() => answer(o)} style={{ fontSize: o.length > 8 ? 18 : 26 }}>
                {o}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--c-mut)', marginTop: 12 }}>
            Не знаєш — обери, як думаєш. Це не оцінка, а перевірка, що тренувати далі.
          </div>
        </div>
      </div>
    </div>
  );
}
