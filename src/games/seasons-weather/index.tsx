import type { Difficulty, GameDefinition, GameComponentProps, LevelData, ProfileLevel } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { FindPicture, makeFindRounds, type FindItem, type FindPayload } from '../shared/find-picture';
import { generate as generateSchool, type Payload } from './generate';

/** Дошкілля (10.10.2026): «Знайди зиму» — чотири намальовані сцени, ціль звучить (було: емодзі-листок і назви словами). */
const KID_SEASONS: FindItem[] = [
  { id: 'winter', say: 'зиму', img: '/count/sea_winter.webp' },
  { id: 'spring', say: 'весну', img: '/count/sea_spring.webp' },
  { id: 'summer', say: 'літо', img: '/count/sea_summer.webp' },
  { id: 'autumn', say: 'осінь', img: '/count/sea_autumn.webp' },
].map((x) => ({ ...x, node: <img src={x.img} alt="" draggable={false} style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 18, display: 'block' }} /> }));

/** Погода (10.10, прохання Тараса): сонячно, дощ, сніг, вітер. */
const KID_WEATHER: FindItem[] = [
  { id: 'sunny', say: 'сонечко', img: '/count/sea_sunny.webp' },
  { id: 'rainy', say: 'дощик', img: '/count/sea_rainy.webp' },
  { id: 'snowy', say: 'сніг', img: '/count/sea_snowy.webp' },
  { id: 'windy', say: 'вітер', img: '/count/sea_windy.webp' },
];

/**
 * Рівні для малих: 1 — пори року, 2 — погода, 3 — упереміш (у кожному раунді картки одного набору).
 * Завжди всі чотири картки — пір року чотири (Тарас, 10.10: «чомусь тільки три»).
 */
function generate(d: Difficulty, level: ProfileLevel, ...rest: unknown[]): LevelData<Payload, string> {
  if (level === 'L0') {
    const seasons = makeFindRounds(KID_SEASONS, d, 4, { count: 4, set: 'season' }).rounds;
    const weather = makeFindRounds(KID_WEATHER, d, 4, { count: 4, set: 'weather' }).rounds;
    const picked = d === 1 ? seasons : d === 2 ? weather : [seasons[0], weather[0], seasons[1], weather[1], seasons[2]];
    return { difficulty: d, rounds: picked.map((r, i) => ({ ...r, id: `r${i}` })) } as unknown as LevelData<Payload, string>;
  }
  return (generateSchool as (...a: unknown[]) => LevelData<Payload, string>)(d, level, ...rest);
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as FindPayload).kid) {
    const weather = (props.round.payload as unknown as FindPayload).set === 'weather';
    return <FindPicture {...(props as unknown as GameComponentProps<FindPayload, string>)} items={weather ? KID_WEATHER : KID_SEASONS} phrase={{ key: 'p_find_season', text: 'Знайди' }} prefix={weather ? 'weather' : 'season'} big />;
  }
  return <SchoolSeasons {...props} />;
}

function SchoolSeasons({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { emoji, kind, options } = round.payload;
  const question = kind === 'season' ? 'Яка це пора року?' : 'Яка зараз погода?';
  const choices = options.map((value) => ({ value }));

  return (
    <>
      <PromptCard question={question} answerState={answerState}>
        <div style={{ fontSize: 96, textAlign: 'center', margin: '8px auto' }}>{emoji}</div>
      </PromptCard>
      <ChoiceGrid
        options={choices}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
      />
    </>
  );
}

const seasonsWeather: GameDefinition<Payload, string> = {
  id: 'seasons-weather',
  title: 'Пори року й погода',
  subject: 'science',
  levels: ['L0'],
  icon: '🍂',
  description: 'Впізнай пору року та погоду.',
  accent: '#FFEDD5',
  // TODO: мапінг на ЯДС skills коли зʼявляться
  generate,
  Component,
};

export default seasonsWeather;
