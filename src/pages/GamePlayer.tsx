import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getPlace, PLACES } from '@/pages/preschool/places';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getGame, profileLevel, profileClass } from '@/games/registry';
import GameShell from '@/games/GameShell';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: 24,
        fontFamily: 'var(--font-round)',
        fontWeight: 800,
        color: 'var(--c-mut)',
        background: 'var(--c-bg)',
      }}
    >
      {children}
    </div>
  );
}

export default function GamePlayer() {
  const navigate = useNavigate();
  const { id: gameId } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const { user } = useAuthStore();
  const { activeProfile, loadProfiles } = useProfileStore();

  useEffect(() => {
    if (!activeProfile) loadProfiles(user?.id);
  }, [activeProfile, user, loadProfiles]);

  const game = gameId ? getGame(gameId) : undefined;

  if (!activeProfile) return <Centered>Завантаження…</Centered>;
  if (!game) {
    return (
      <Centered>
        <div>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🤔</div>
          Такої гри немає.
          <br />
          <button className="g-btn soft" style={{ marginTop: 16 }} onClick={() => navigate('/hub')}>
            До ігор
          </button>
        </div>
      </Centered>
    );
  }

  // дошкілля: назад — у місце, звідки прийшли (?from=), інакше — у місце, де ця гра живе
  const preschool = profileClass(activeProfile) === 'preschool';
  const place = preschool ? getPlace(search.get('from') ?? '') ?? PLACES.find((p) => p.games.includes(game.id)) : undefined;
  const nextId = place ? place.games[(place.games.indexOf(game.id) + 1) % place.games.length] : undefined;

  return (
    <GameShell
      key={game.id}
      game={game}
      level={profileLevel(activeProfile)}
      classLevel={profileClass(activeProfile)}
      profileId={activeProfile.id}
      onExit={() => navigate(place ? `/place/${place.id}` : '/hub')}
      onNext={nextId ? () => navigate(`/game/${nextId}?from=${place!.id}`) : undefined}
    />
  );
}
