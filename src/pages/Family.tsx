import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore, type ChildProfile } from '@/stores/useProfileStore';
import ParentalGate from '@/components/ParentalGate';
import { gamesForClass, getGame, profileClass } from '@/games/registry';
import { CLASS_META } from '@/games/types';
import { MAX_STEPS, defaultPlan, loadPlan, moveStep, savePlan, type FamilyPlan } from '@/school/family-plan';
import { readLog, weekSummary } from '@/school/game-log';
import { loadStats } from '@/games/times-tables/storage';
import { TABLES, isKnown as factKnown, weakFacts } from '@/games/times-tables/core';
import { loadDict } from '@/games/english-words/storage';
import { counts as wordCounts } from '@/games/english-words/core';
import { LETTERS } from '@/games/uk-letters/letters';
import { isKnown as letterKnown, type LetterProgress } from '@/games/uk-letters/core';

const DOW = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function loadLetters(id: string): LetterProgress {
  try {
    return JSON.parse(localStorage.getItem(`shk.ukl.v1.${id}`) ?? '{}');
  } catch {
    return {};
  }
}

const small = { fontSize: 12.5, fontWeight: 700, color: 'var(--c-mut)' } as const;
const h = { fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--c-mut)', margin: '14px 0 8px' } as const;

/** Тиждень однієї дитини: дні, ігри, де помилялась, що вже знає. */
function Week({ child }: { child: ChildProfile }) {
  const now = Date.now();
  const w = useMemo(() => weekSummary(readLog(child.id), now), [child.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const facts = loadStats(child.id);
  const knownFacts = Object.values(facts).filter(factKnown).length;
  const shaky = weakFacts(facts).slice(0, 6).map((k) => k.replace('x', '×'));
  const words = wordCounts(loadDict(child.id));
  const letters = loadLetters(child.id);
  const knownLetters = LETTERS.filter((l) => letterKnown(letters[l.ch])).length;
  const hard = w.byGame.filter((g) => g.mistakes > 0).slice(0, 3);

  return (
    <>
      <div style={h}>Тиждень</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        {w.days.map((d) => (
          <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: 30,
                borderRadius: 8,
                background: d.games > 0 ? 'var(--c-green)' : 'var(--c-line)',
                color: '#fff',
                fontWeight: 900,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {d.games || ''}
            </div>
            <div style={{ ...small, fontSize: 11, marginTop: 3 }}>{DOW[new Date(d.day + 'T12:00').getDay()]}</div>
          </div>
        ))}
      </div>
      <div style={{ ...small, marginTop: 8 }}>
        Днів із заняттями: <b style={{ color: 'var(--c-ink)' }}>{w.activeDays} з 7</b> · ігор: <b style={{ color: 'var(--c-ink)' }}>{w.games}</b> · помилок: <b style={{ color: 'var(--c-ink)' }}>{w.mistakes}</b>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, fontSize: 14, fontWeight: 700, color: 'var(--c-ink)' }}>
        {hard.length > 0 && (
          <div>
            🎯 Найважче цього тижня:{' '}
            {hard.map((g) => `${getGame(g.gameId)?.title ?? g.gameId} (помилок ${g.mistakes} за ${g.count})`).join(', ')}
          </div>
        )}
        {knownFacts > 0 || shaky.length > 0 ? (
          <div>
            ✖️ Таблиця множення: вивчено {knownFacts} з 36
            {shaky.length > 0 && <span style={{ color: '#B45309' }}> · плутає: {shaky.join(', ')}</span>}
          </div>
        ) : null}
        {words.learning + words.known > 0 && (
          <div>
            🔤 Англійська: знає {words.known} слів, вчить {words.learning}
          </div>
        )}
        {knownLetters > 0 && <div>🅰️ Букви: знає {knownLetters} з {LETTERS.length}</div>}
        {w.games === 0 && <div style={small}>Цього тижня занять ще не було.</div>}
      </div>
    </>
  );
}

/** План «Після школи» для дитини: які кроки, у якому порядку, яку таблицю. */
function PlanEditor({ child }: { child: ChildProfile }) {
  const cl = profileClass(child);
  const [plan, setPlan] = useState<FamilyPlan>(() => loadPlan(child.id, cl));
  const [adding, setAdding] = useState('');
  const available = gamesForClass(cl).filter((g) => !plan.steps.includes(g.id));
  const update = (p: FamilyPlan) => {
    setPlan(p);
    savePlan(child.id, p);
  };

  return (
    <>
      <div style={h}>Кроки «Після школи»</div>
      {plan.steps.map((id, i) => (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: i ? '1px solid var(--c-line)' : 'none' }}>
          <span style={{ width: 20, ...small }}>{i + 1}</span>
          <span style={{ fontSize: 20 }}>{getGame(id)?.icon}</span>
          <span style={{ flex: 1, fontWeight: 800, color: 'var(--c-ink)' }}>{getGame(id)?.title ?? id}</span>
          <button className="g-iconbtn" style={{ width: 30, height: 30 }} aria-label="Вище" disabled={i === 0} onClick={() => update({ ...plan, steps: moveStep(plan.steps, i, -1) })}>
            ↑
          </button>
          <button className="g-iconbtn" style={{ width: 30, height: 30 }} aria-label="Нижче" disabled={i === plan.steps.length - 1} onClick={() => update({ ...plan, steps: moveStep(plan.steps, i, 1) })}>
            ↓
          </button>
          <button
            className="g-iconbtn"
            style={{ width: 30, height: 30 }}
            aria-label="Прибрати"
            disabled={plan.steps.length <= 1}
            onClick={() => update({ ...plan, steps: plan.steps.filter((s) => s !== id) })}
          >
            ✕
          </button>
        </div>
      ))}
      {plan.steps.length < MAX_STEPS && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <select value={adding} onChange={(e) => setAdding(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 'var(--c-r-sm)', border: '1.5px solid var(--c-line)', fontWeight: 700 }}>
            <option value="">+ додати крок…</option>
            {available.map((g) => (
              <option key={g.id} value={g.id}>
                {g.icon} {g.title}
              </option>
            ))}
          </select>
          <button
            className="g-btn primary"
            style={{ width: 'auto', padding: '10px 16px' }}
            disabled={!adding}
            onClick={() => {
              update({ ...plan, steps: [...plan.steps, adding] });
              setAdding('');
            }}
          >
            Додати
          </button>
        </div>
      )}

      {plan.steps.includes('times-tables') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span style={{ flex: 1, fontWeight: 700, color: 'var(--c-ink)', fontSize: 14 }}>✖️ Таблиця на цей тиждень</span>
          <select
            value={plan.ttTable ?? ''}
            onChange={(e) => update({ ...plan, ttTable: e.target.value ? Number(e.target.value) : null })}
            style={{ padding: 10, borderRadius: 'var(--c-r-sm)', border: '1.5px solid var(--c-line)', fontWeight: 800 }}
          >
            <option value="">Сама обере</option>
            {TABLES.map((n) => (
              <option key={n} value={n}>
                ×{n}
              </option>
            ))}
          </select>
        </div>
      )}

      <button className="g-btn ghost" style={{ marginTop: 12, fontSize: 13, padding: 10 }} onClick={() => update(defaultPlan(cl))}>
        Повернути типовий план класу
      </button>
    </>
  );
}

/** «Для батьків»: план і тиждень кожної дитини на одному екрані. За батьківським замком. */
export default function Family() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profiles, activeProfile, loadProfiles } = useProfileStore();
  const [unlocked, setUnlocked] = useState(false);
  // замок після правильної відповіді кличе і onSuccess, і onClose — назад ідемо лише тоді, коли закрили без відповіді
  const passed = useRef(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProfile) loadProfiles(user?.id);
  }, [activeProfile, user, loadProfiles]);

  if (!unlocked) {
    return (
      <div className="g-screen">
        <ParentalGate
          isOpen
          onClose={() => !passed.current && navigate(-1)}
          onSuccess={() => {
            passed.current = true;
            setUnlocked(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="g-screen">
      <div className="play-col">
        <div className="g-topbar">
          <button className="g-iconbtn" aria-label="Назад" onClick={() => navigate(-1)}>
            ←
          </button>
          <div style={{ flex: 1, fontWeight: 900, fontFamily: 'var(--font-round)', color: 'var(--c-ink)' }}>Для батьків</div>
        </div>
        <div className="g-scroll">
          {profiles.length === 0 && <div className="g-card" style={small}>Профілів дітей ще немає.</div>}
          {profiles.map((child) => (
            <div key={child.id} className="g-card" style={{ textAlign: 'left', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 900, fontSize: 18, color: 'var(--c-ink)' }}>{child.nickname}</span>
                  <span style={small}>{CLASS_META[profileClass(child)].title}</span>
                </span>
                <button className="g-btn soft" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }} onClick={() => setOpen(open === child.id ? null : child.id)}>
                  {open === child.id ? 'Згорнути' : '⚙️ План'}
                </button>
              </div>
              {open === child.id && <PlanEditor child={child} />}
              <Week child={child} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
