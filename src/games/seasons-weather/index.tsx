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

function generate(d: Difficulty, level: ProfileLevel, ...rest: unknown[]): LevelData<Payload, string> {
  if (level === 'L0') return makeFindRounds(KID_SEASONS, d) as unknown as LevelData<Payload, string>;
  return (generateSchool as (...a: unknown[]) => LevelData<Payload, string>)(d, level, ...rest);
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as FindPayload).kid)
    return <FindPicture {...(props as unknown as GameComponentProps<FindPayload, string>)} items={KID_SEASONS} phrase={{ key: 'p_find_season', text: 'Знайди' }} prefix="season" big />;
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
