import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { loadDict, saveDict } from '@/games/english-words/storage';
import { addCustom, type Dict, type Status } from '@/games/english-words/core';
import { canSpeak, speak } from '@/games/english-words/speech';
import {
  ERROR_TEXT,
  HOMEWORK_API,
  compressPhoto,
  explainPhoto,
  inDictionary,
  loadFamilyCode,
  saveFamilyCode,
  wordStatus,
  type HomeworkError,
  type HomeworkExplanation,
} from '@/school/homework';

const STATUS_LABEL: Record<Status, string> = { new: 'нове', learning: 'вчу', known: 'знаю' };
const STATUS_COLOR: Record<Status, string> = { new: '#B45309', learning: 'var(--c-primary)', known: '#15803D' };

/** «Що в завданні?» — фото сторінки → що треба зробити, з чого почати, які слова нові. */
export default function Homework() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeProfile, loadProfiles } = useProfileStore();
  const profileId = activeProfile?.id ?? 'guest';
  const [code, setCode] = useState(loadFamilyCode);
  const [codeDraft, setCodeDraft] = useState('');
  const [dict, setDict] = useState<Dict>(() => loadDict(profileId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<HomeworkError | null>(null);
  const [result, setResult] = useState<HomeworkExplanation | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeProfile) loadProfiles(user?.id);
  }, [activeProfile, user, loadProfiles]);
  useEffect(() => setDict(loadDict(profileId)), [profileId]);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const image = await compressPhoto(file);
      setResult(await explainPhoto(image, code));
    } catch (e) {
      const err = (typeof e === 'string' ? e : 'image') as HomeworkError;
      if (err === 'code') {
        saveFamilyCode('');
        setCode('');
      }
      setError(err);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addWord = (w: HomeworkExplanation['words'][number]) => {
    const next = addCustom(dict, { en: w.en.trim().toLowerCase(), ua: w.ua, emoji: w.emoji || '📝' });
    saveDict(profileId, next);
    setDict(next);
  };

  const top = (
    <div className="g-topbar">
      <button className="g-iconbtn" aria-label="Назад" onClick={() => navigate(-1)}>
        ←
      </button>
      <div style={{ flex: 1, fontWeight: 900, fontFamily: 'var(--font-round)', color: 'var(--c-ink)' }}>Що в завданні?</div>
    </div>
  );

  let body: React.ReactNode;
  if (!HOMEWORK_API) {
    body = (
      <div className="g-card" style={{ color: 'var(--c-mut)', fontWeight: 700 }}>
        📷 Помічник ще не підключений. Скоро тут можна буде сфотографувати завдання і зрозуміти, що треба зробити.
      </div>
    );
  } else if (!code) {
    body = (
      <div className="g-card">
        <div className="g-question">Для батьків: введіть сімейний код один раз</div>
        <input
          type="password"
          inputMode="numeric"
          value={codeDraft}
          onChange={(e) => setCodeDraft(e.target.value)}
          style={{ width: '100%', padding: 14, fontSize: 20, borderRadius: 'var(--c-r-sm)', border: '1.5px solid var(--c-line)', textAlign: 'center', marginBottom: 12 }}
        />
        <button
          className="g-btn primary"
          disabled={!codeDraft.trim()}
          onClick={() => {
            saveFamilyCode(codeDraft.trim());
            setCode(codeDraft.trim());
            setCodeDraft('');
          }}
        >
          Зберегти
        </button>
      </div>
    );
  } else {
    body = (
      <>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        <button className="g-btn primary" disabled={busy} onClick={() => fileRef.current?.click()} style={{ marginBottom: 14 }}>
          {busy ? '⏳ Читаю завдання…' : result ? '📷 Сфотографувати інше' : '📷 Сфотографувати завдання'}
        </button>

        {error && (
          <div className="g-card" style={{ color: '#B45309', fontWeight: 700, marginBottom: 14 }}>
            {ERROR_TEXT[error]}
          </div>
        )}

        {result && (
          <>
            <div className="g-card" style={{ textAlign: 'left', marginBottom: 12 }}>
              <div className="g-question" style={{ textAlign: 'left' }}>Що треба зробити</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-ink)', lineHeight: 1.45 }}>{result.task}</div>
            </div>

            {result.readable && result.steps.length > 0 && (
              <div className="g-card" style={{ textAlign: 'left', marginBottom: 12, background: '#F0FBF4', borderColor: '#C6EFD4' }}>
                <div className="g-question" style={{ textAlign: 'left', color: '#15803D' }}>З чого почати</div>
                {result.steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, fontWeight: 700, fontSize: 15, color: '#15803D', marginTop: i ? 7 : 0 }}>
                    <span>{i + 1}.</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {result.words.length > 0 && (
              <div className="g-card" style={{ textAlign: 'left' }}>
                <div className="g-question" style={{ textAlign: 'left' }}>Слова на сторінці</div>
                {result.words.map((w) => {
                  const st = wordStatus(dict, w.en);
                  const have = inDictionary(dict, w.en);
                  return (
                    <div key={w.en} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--c-line)' }}>
                      <span style={{ fontSize: 24, width: 30, textAlign: 'center' }}>{w.emoji || '📝'}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--c-ink)', display: 'block' }}>{w.en}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-mut)' }}>{w.ua}</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: STATUS_COLOR[st] }}>{STATUS_LABEL[st]}</span>
                      {canSpeak() && (
                        <button className="g-iconbtn" style={{ width: 34, height: 34 }} aria-label={`Послухати ${w.en}`} onClick={() => speak(w.en)}>
                          🔊
                        </button>
                      )}
                      {!have && (
                        <button className="g-iconbtn" style={{ width: 34, height: 34 }} aria-label={`Додати ${w.en} у словник`} onClick={() => addWord(w)}>
                          ＋
                        </button>
                      )}
                    </div>
                  );
                })}
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-mut)', marginTop: 8 }}>
                  ＋ додає слово в «Мої слова» — воно з'явиться в повторенні.
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <div className="g-screen">
      <div className="play-col">
        {top}
        <div className="g-scroll">{body}</div>
      </div>
    </div>
  );
}
