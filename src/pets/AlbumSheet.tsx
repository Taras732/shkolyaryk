import type { ReactNode } from 'react';
import { KID_ANIMALS } from '@/games/animals-habitat/kids';
import { KID_ITEMS } from '@/games/sink-float/kids';
import { KID_SYMBOLS } from '@/games/ua-symbols';
import { WEATHER } from '@/games/dress-weather';
import { getAlbum } from './album';
import { getWardrobe } from './wardrobe';

/**
 * Альбом друга (модель «результат живе», 10.10.2026): знайдене в іграх — кольорова наліпка, незнайдене — силует.
 * Розділи прив'язані до ігор, звідки наліпки беруться, — дитина бачить, куди піти по ще.
 */
export default function AlbumSheet({ profileId, onClose }: { profileId: string; onClose: () => void }) {
  const a = getAlbum(profileId);
  const wear = getWardrobe(profileId);
  const clothes = [...new Set(Object.values(WEATHER).flatMap((w) => w.wear as readonly string[]))];
  const sections: { title: string; where: string; items: { id: string; node: ReactNode }[]; have: string[] }[] = [
    { title: 'Звірята', where: 'Де живе тварина', items: KID_ANIMALS.map((x) => ({ id: x.id, node: img(x.id) })), have: a.animals },
    { title: 'Моя Україна', where: 'Символи України', items: KID_SYMBOLS.map((x) => ({ id: x.id, node: x.node ?? img(x.img!.replace('/count/', '').replace('.webp', '')) })), have: a.symbols },
    { title: 'Знахідки з води', where: 'Тоне чи плаває', items: KID_ITEMS.map((x) => ({ id: x.id, node: img(x.id) })), have: a.finds },
    { title: 'Шафа', where: 'Що вдягнути?', items: clothes.map((id) => ({ id, node: img(id) })), have: wear },
  ];
  return (
    <div role="dialog" aria-label="Альбом" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(60,40,20,.35)', display: 'grid', placeItems: 'center', padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: '86vh', overflowY: 'auto', overflowX: 'hidden', background: '#FFF8EE', borderRadius: 28, padding: 14 }}>
        <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 20, textAlign: 'center', marginBottom: 6 }}>📒 Альбом друга</div>
        {sections.map((s) => (
          <div key={s.title} style={{ marginTop: 10 }}>
            <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 15, color: '#8a6a4a' }}>{s.title} · {s.have.filter((h) => s.items.some((i) => i.id === h)).length}/{s.items.length}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
              {s.items.map((it) => {
                const got = s.have.includes(it.id);
                return (
                  <div key={it.id} title={got ? '' : `Шукай у грі «${s.where}»`}
                    style={{ aspectRatio: '1', minWidth: 0, overflow: 'hidden', borderRadius: 14, background: got ? '#fff' : '#F3EADC', display: 'grid', placeItems: 'center', padding: 4, boxShadow: got ? '0 3px 0 #F1E3CF' : 'none' }}>
                    <div style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0, display: 'grid', placeItems: 'center', filter: got ? undefined : 'brightness(0) opacity(.18)' }}>{it.node}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <button type="button" onClick={onClose} style={{ display: 'block', margin: '14px auto 0', border: 0, borderRadius: 18, padding: '10px 24px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>Закрити</button>
      </div>
    </div>
  );
}

const img = (id: string) => <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />;
