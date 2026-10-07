import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getGame, profileClass, profileLevel } from '@/games/registry';
import { DIFFICULTY_LABEL, type Difficulty } from '@/games/types';
import GameShell from '@/games/GameShell';
import { AFTER_SCHOOL_PLAN, buildDayReport, isSameDay, type LastAttempt } from '@/school/after-school';
import { loadDict } from '@/games/english-words/storage';
import { loadStats } from '@/games/times-tables/storage';

/**
 * «Після школи»: три кроки під клас дитини + звіт «що зроблено сьогодні»
 * (його ж показують батькам увечері). Крок зараховується, коли гра дійшла до
 * кінця — GameShell оновлює history.at останньої спроби.
 */
export default function AfterSchool() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeProfile, loadProfiles, progress } = useProfileStore();
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProfile) loadProfiles(user?.id);
  }, [activeProfile, user, loadProfiles]);

  const now = Date.now();
  const profileId = activeProfile?.id ?? 'guest';
  const plan = activeProfile ? AFTER_SCHOOL_PLAN[profileClass(activeProfile)] : [];
  const attempts: Record<string, LastAttempt | undefined> = useMemo(() => {
    const p = progress[profileId] ?? {};
    return Object.fromEntries(Object.entries(p).map(([id, g]) => [id, g.history as LastAttempt]));
  }, [progress, profileId]);

  // локальні словник і таблиця перечитуються після кожної гри (playing → null)
  const report = useMemo(
    () => buildDayReport(attempts, loadDict(profileId), loadStats(profileId), now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempts, profileId, playing],
  );

  if (!activeProfile) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-mut)', fontWeight: 800 }}>Завантаження…</div>;

  if (playing) {
    const game = getGame(playing)!;
    return (
      <GameShell
        key={playing}
        game={game}
        level={profileLevel(activeProfile)}
        classLevel={profileClass(activeProfile)}
        profileId={activeProfile.id}
        onExit={() => setPlaying(null)}
      />
    );
  }

  const doneToday = (id: string) => isSameDay(attempts[id]?.at, now);
  const allDone = plan.every(doneToday);
  const nextId = plan.find((id) => !doneToday(id));

  return (
    <div className="g-screen">
      <div className="play-col">
        <div className="g-topbar">
          <button className="g-iconbtn" aria-label="Назад" onClick={() => navigate('/hub')}>
            ←
          </button>
          <div style={{ flex: 1, fontWeight: 900, fontFamily: 'var(--font-round)', color: 'var(--c-ink)' }}>Після школи · 15 хв</div>
        </div>
        <div className="g-scroll">
          <div className="g-card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 40 }}>{allDone ? '🎉' : '🎒'}</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--c-ink)', marginTop: 4 }}>
              {allDone ? 'Готово на сьогодні!' : `Привіт, ${activeProfile.nickname}! Три кроки — і на сьогодні все`}
            </div>
          </div>

          {plan.map((id, i) => {
            const g = getGame(id);
            if (!g) return null;
            const done = doneToday(id);
            return (
              <button
                key={id}
                className="g-card"
                onClick={() => setPlaying(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 10,
                  cursor: 'pointer',
                  borderColor: id === nextId ? 'var(--c-primary)' : undefined,
                  borderWidth: id === nextId ? 2 : undefined,
                }}
              >
                <span style={{ fontSize: 30 }}>{done ? '✅' : g.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--c-mut)' }}>Крок {i + 1}</span>
                  <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--c-ink)' }}>{g.title}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: done ? '#15803D' : 'var(--c-primary)' }}>
                  {done ? 'Зроблено' : 'Почати →'}
                </span>
              </button>
            );
          })}

          <button className="g-btn soft" onClick={() => navigate('/homework')} style={{ marginTop: 6 }}>
            📷 Є домашка? Що в завданні?
          </button>

          <div className="g-card" style={{ marginTop: 18, textAlign: 'left' }}>
            <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--c-mut)', marginBottom: 10 }}>
              Що зроблено сьогодні · для батьків
            </div>
            {report.games.length === 0 && report.english.practiced === 0 ? (
              <div style={{ color: 'var(--c-mut)', fontWeight: 700 }}>Сьогодні ще не займались.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontWeight: 700, color: 'var(--c-ink)', fontSize: 14.5 }}>
                {report.games.map((r) => (
                  <div key={r.gameId}>
                    {getGame(r.gameId)?.icon} {getGame(r.gameId)?.title ?? r.gameId}
                    <span style={{ color: 'var(--c-mut)' }}>
                      {r.difficulty ? ` · ${DIFFICULTY_LABEL[r.difficulty as Difficulty]}` : ''}
                      {r.mistakes !== undefined ? ` · помилок: ${r.mistakes}` : ''}
                    </span>
                  </div>
                ))}
                {report.english.practiced > 0 && (
                  <div>
                    🔤 Англійська: повторено слів — {report.english.practiced}
                    {report.english.added > 0 ? `, нових — ${report.english.added}` : ''}
                    <span style={{ color: 'var(--c-mut)' }}> · уже знає: {report.english.known}</span>
                  </div>
                )}
                {report.tables.practiced > 0 && (
                  <div>
                    ✖️ Таблиця множення: фактів сьогодні — {report.tables.practiced}
                    <span style={{ color: 'var(--c-mut)' }}> · вивчено всього: {report.tables.known} з 36</span>
                  </div>
                )}
                {report.tables.shaky.length > 0 && (
                  <div style={{ color: '#B45309' }}>⚠️ Ще плутає: {report.tables.shaky.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
