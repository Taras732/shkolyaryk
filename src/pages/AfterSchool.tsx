import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getGame, profileClass, profileLevel } from '@/games/registry';
import { DIFFICULTY_LABEL, type Difficulty } from '@/games/types';
import GameShell from '@/games/GameShell';
import { buildDayReport, isSameDay, type LastAttempt } from '@/school/after-school';
import { resolvePlan } from '@/school/plan-resolve';
import { checkDue } from '@/school/monthly-check';
import { completeDay, goalProgress, loadRewards, saveRewards, streak, type Rewards } from '@/school/rewards';
import { loadDict } from '@/games/english-words/storage';
import { loadStats } from '@/games/times-tables/storage';
import { weakFacts } from '@/games/times-tables/core';
import { sendDaySummary } from '@/school/report-sync';

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
  // план, налаштований батьками (/family); без налаштування — типовий для класу
  // розумний план (або обраний батьками) з поясненням «чому» до кожного кроку
  const planned = useMemo(() => (activeProfile ? resolvePlan(activeProfile) : []), [activeProfile]);
  const plan = planned.map((p) => p.gameId);
  const reasonOf = (id: string) => planned.find((p) => p.gameId === id)?.reason;
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

  const doneToday = (id: string) => isSameDay(attempts[id]?.at, now);
  const allDone = plan.length > 0 && plan.every(doneToday);
  const nextId = plan.find((id) => !doneToday(id));

  const [rewards, setRewards] = useState<Rewards>(() => loadRewards(profileId));
  const [newSticker, setNewSticker] = useState<string | null>(null);
  const [showAlbum, setShowAlbum] = useState(false);
  useEffect(() => setRewards(loadRewards(profileId)), [profileId]);
  // усі кроки зроблені — зараховуємо день і даємо наліпку (раз на день)
  useEffect(() => {
    if (playing || !activeProfile) return;
    let sticker: string | null = null;
    if (allDone) {
      const res = completeDay(loadRewards(profileId), Date.now());
      sticker = res.sticker;
      if (sticker) {
        saveRewards(profileId, res.rewards);
        setRewards(res.rewards);
        setNewSticker(sticker);
      }
    }
    // підсумок дня для вечірнього звіту: що зроблено і що дитина ще плутає
    if (Object.values(attempts).some((a) => isSameDay(a?.at, Date.now()))) {
      const shaky = weakFacts(loadStats(profileId)).slice(0, 6).map((k) => k.replace('x', '×'));
      sendDaySummary(activeProfile, { afterSchoolDone: allDone, shaky, sticker: sticker ?? undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, playing, profileId, activeProfile]);

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

  const fire = streak(rewards, now);
  const goal = goalProgress(rewards);

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
              {allDone ? 'Готово на сьогодні!' : `Привіт, ${activeProfile.nickname}! ${plan.length} ${plan.length === 1 ? 'крок' : plan.length < 5 ? 'кроки' : 'кроків'} — і на сьогодні все`}
            </div>
          </div>

          {newSticker && (
            <div className="g-card" style={{ marginBottom: 14, background: '#FFF7ED', borderColor: '#FED7AA', animation: 'fadeInUp .4s ease both' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#C2410C', textTransform: 'uppercase' }}>Нова наліпка!</div>
              <div style={{ fontSize: 72, animation: 'starPop .6s ease both' }}>{newSticker}</div>
            </div>
          )}

          {(fire > 0 || goal || rewards.stickers.length > 0) && (
            <div className="g-card" style={{ marginBottom: 14, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {fire > 0 && <span style={{ fontWeight: 900, fontSize: 16, color: '#C2410C' }}>🔥 {fire} {fire === 1 ? 'день' : fire < 5 ? 'дні' : 'днів'} поспіль</span>}
                <span style={{ flex: 1 }} />
                {rewards.stickers.length > 0 && (
                  <button className="g-btn soft" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }} onClick={() => setShowAlbum(!showAlbum)}>
                    Мої наліпки · {rewards.stickers.length}
                  </button>
                )}
              </div>
              {goal && rewards.goal && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-ink)' }}>
                    {goal.reached ? `🎉 Нагорода твоя: ${rewards.goal.text}! Покажи батькам` : `🎁 ${rewards.goal.text}: ${goal.done} з ${goal.need} днів`}
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'var(--c-line)', marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${(goal.done / goal.need) * 100}%`, height: '100%', background: goal.reached ? 'var(--c-green)' : 'var(--c-primary)', transition: 'width .5s' }} />
                  </div>
                </div>
              )}
              {showAlbum && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginTop: 10, fontSize: 26, textAlign: 'center' }}>
                  {rewards.stickers.map((st, i) => (
                    <span key={i}>{st}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {checkDue(profileId, now) && (
            <button className="g-card" onClick={() => navigate('/check')} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginBottom: 10, cursor: 'pointer', background: '#FEF3C7', borderColor: '#FDE68A' }}>
              <span style={{ fontSize: 30 }}>🧭</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 900, fontSize: 16, color: 'var(--c-ink)' }}>Перевірка місяця · 5 хв</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-mut)' }}>Раз на місяць — щоб план знав, що тренувати</span>
              </span>
            </button>
          )}

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
                  {reasonOf(id) && !done && (
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--c-mut)', marginTop: 2 }}>💡 {reasonOf(id)}</span>
                  )}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: done ? 'var(--c-ok-ink)' : 'var(--c-primary)' }}>
                  {done ? 'Зроблено' : 'Почати →'}
                </span>
              </button>
            );
          })}

          <button className="g-btn soft" onClick={() => navigate('/homework')} style={{ marginTop: 6 }}>
            📷 Є домашка? Що в завданні?
          </button>
          <button className="g-btn ghost" onClick={() => navigate('/family')} style={{ marginTop: 10 }}>
            ⚙️ Для батьків: план і тиждень
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
                  <div style={{ color: 'var(--c-warn-ink)' }}>⚠️ Ще плутає: {report.tables.shaky.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
