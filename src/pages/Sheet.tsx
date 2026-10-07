import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { profileClass } from '@/games/registry';
import { CLASS_META, type Difficulty } from '@/games/types';
import { buildSheet } from '@/school/sheet';
import { loadStats } from '@/games/times-tables/storage';
import { loadDict } from '@/games/english-words/storage';
import type { LetterProgress } from '@/games/uk-letters/core';

function loadLetters(id: string): LetterProgress {
  try {
    return JSON.parse(localStorage.getItem(`shk.ukl.v1.${id}`) ?? '{}');
  } catch {
    return {};
  }
}

/** Стилі друку: лише аркуш, A4, відповіді — з нової сторінки. */
const PRINT_CSS = `
@media print {
  /* контейнери застосунку мають фіксовану висоту з прокруткою — на друці це обрізало б аркуш */
  html, body, #root, .web-shell, .g-screen, .play-col, .g-scroll { height: auto !important; min-height: 0 !important; overflow: visible !important; }
  body * { visibility: hidden !important; }
  .sheet-print, .sheet-print * { visibility: visible !important; }
  .sheet-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .sheet-noprint { display: none !important; }
  .sheet-answers { page-break-before: always; break-before: page; }
  @page { size: A4; margin: 14mm; }
}`;

export default function Sheet() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { profiles, loadProfiles } = useProfileStore();
  const [seed, setSeed] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  useEffect(() => {
    if (!profiles.length) loadProfiles(user?.id);
  }, [profiles.length, user, loadProfiles]);

  const child = profiles.find((p) => p.id === id);
  const sections = useMemo(
    () => (child ? buildSheet({ cl: profileClass(child), difficulty, facts: loadStats(child.id), dict: loadDict(child.id), letters: loadLetters(child.id) }) : []),
    // seed — «інші приклади»: перегенерувати аркуш
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [child, difficulty, seed],
  );

  if (!child) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-mut)', fontWeight: 800 }}>Завантаження…</div>;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', weekday: 'long' }).format(tomorrow);

  return (
    <div className="g-screen">
      <style>{PRINT_CSS}</style>
      <div className="play-col">
        <div className="g-topbar sheet-noprint">
          <button className="g-iconbtn" aria-label="Назад" onClick={() => navigate(-1)}>
            ←
          </button>
          <div style={{ flex: 1, fontWeight: 900, fontFamily: 'var(--font-round)', color: 'var(--c-ink)' }}>Аркуш на завтра</div>
        </div>
        <div className="g-scroll">
          <div className="sheet-noprint" style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button className="g-btn primary" style={{ flex: 1 }} onClick={() => window.print()}>
              🖨️ Друкувати
            </button>
            <button className="g-btn soft" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => setSeed(seed + 1)}>
              🔄 Інші приклади
            </button>
            <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value) as Difficulty)} style={{ padding: 10, borderRadius: 'var(--c-r-sm)', border: '1.5px solid var(--c-line)', fontWeight: 800 }}>
              <option value={1}>Легко</option>
              <option value={2}>Середньо</option>
              <option value={3}>Складно</option>
            </select>
          </div>

          <div className="sheet-print" style={{ background: '#fff', color: '#111', borderRadius: 12, padding: 20, fontFamily: 'var(--font-round)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 22, fontWeight: 900 }}>📚 {child.nickname}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {CLASS_META[profileClass(child)].title} · {date}
              </span>
            </div>
            {sections.map((s, si) => (
              <div key={si} style={{ marginBottom: 18, breakInside: 'avoid' }}>
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>
                  {si + 1}. {s.title}
                </div>
                {s.hint && <div style={{ fontSize: 12.5, fontStyle: 'italic', marginBottom: 6 }}>{s.hint}</div>}
                {s.trace && (
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {s.trace.map((ch) => (
                      <span key={ch} style={{ fontSize: 110, fontWeight: 900, color: 'transparent', WebkitTextStroke: '2px #999', letterSpacing: 18 }}>
                        {ch}
                        {ch.toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: s.items.some((x) => x.task.length > 40) ? '1fr' : 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 18 }}>
                  {s.items.map((it, k) => (
                    <div key={k} style={{ lineHeight: 1.5 }}>
                      {it.task}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="sheet-answers" style={{ marginTop: 26, borderTop: '1px dashed #999', paddingTop: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 6 }}>Відповіді (для батьків)</div>
              {sections
                .filter((s) => s.items.length)
                .map((s, si) => (
                  <div key={si} style={{ fontSize: 12.5, marginBottom: 4 }}>
                    <b>{s.title}:</b> {s.items.map((x) => x.answer).join(' · ')}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
