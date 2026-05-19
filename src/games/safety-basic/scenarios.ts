import type { AgeGroupId } from '../../constants/ageGroups';

export interface SafetyAction {
  key: string;
  label: string;
  consequence: string;
  isSafe: boolean;
}

export interface SafetyScenario {
  key: string;
  ageGroups: AgeGroupId[];
  situation: string;
  icon: string;
  actions: SafetyAction[];
}

export const SCENARIOS: SafetyScenario[] = [
  // ---------- PRESCHOOL ----------
  {
    key: 'strangerCandy',
    ageGroups: ['preschool', 'grade1'],
    situation: 'Незнайомець на вулиці пропонує тобі цукерку і просить піти з ним.',
    icon: '🍬',
    actions: [
      {
        key: 'refuse',
        label: 'Сказати «Ні», крикнути і побігти до мами/тата',
        consequence: 'Ти вчинив правильно! Ніколи не йди з незнайомцями.',
        isSafe: true,
      },
      {
        key: 'take',
        label: 'Взяти цукерку і піти з ним',
        consequence: 'Це небезпечно. Незнайомці можуть бути небезпечними.',
        isSafe: false,
      },
      {
        key: 'wait',
        label: 'Стояти і мовчати',
        consequence: 'Краще відразу крикнути і піти до своїх. Стояти — небезпечно.',
        isSafe: false,
      },
    ],
  },
  {
    key: 'lostInStore',
    ageGroups: ['preschool', 'grade1'],
    situation: 'Ти загубився у великому магазині. Мами чи тата немає поряд.',
    icon: '🏪',
    actions: [
      {
        key: 'askCashier',
        label: 'Підійти до касира або охоронця в магазині і попросити допомогти',
        consequence: 'Правильно! Працівники магазину допоможуть знайти батьків.',
        isSafe: true,
      },
      {
        key: 'goOutside',
        label: 'Вийти надвір і шукати самому',
        consequence: 'На вулиці ще легше загубитися. Краще залишатись усередині.',
        isSafe: false,
      },
      {
        key: 'followStranger',
        label: 'Піти за незнайомцем, який сказав що знає де батьки',
        consequence: 'Небезпечно! Ніколи не йди з незнайомцями, навіть якщо вони обіцяють допомогти.',
        isSafe: false,
      },
    ],
  },
  {
    key: 'fireAlarm',
    ageGroups: ['preschool', 'grade1', 'grade2'],
    situation: 'У школі зазвучала пожежна сигналізація. Всі починають рухатися до виходу.',
    icon: '🔔',
    actions: [
      {
        key: 'evacuate',
        label: 'Спокійно встати і разом з усіма вийти на вулицю',
        consequence: 'Правильно! При пожежній тривозі потрібно евакуюватись.',
        isSafe: true,
      },
      {
        key: 'hide',
        label: 'Сховатися під парту і чекати',
        consequence: 'Небезпечно! Потрібно швидко покинути будівлю.',
        isSafe: false,
      },
      {
        key: 'runBack',
        label: 'Повернутися за портфелем',
        consequence: 'Речі можна замінити, а здоров\'я — ні. Виходь одразу.',
        isSafe: false,
      },
    ],
  },
  // ---------- GRADE1 / GRADE2 ----------
  {
    key: 'foundMedicine',
    ageGroups: ['grade1', 'grade2'],
    situation: 'Ти знайшов красиві таблетки на підлозі. Вони виглядають як цукерки.',
    icon: '💊',
    actions: [
      {
        key: 'tellAdult',
        label: 'Не торкатися і одразу розповісти дорослому',
        consequence: 'Молодець! Ліки небезпечні без лікаря.',
        isSafe: true,
      },
      {
        key: 'eat',
        label: 'Спробувати — може смачні',
        consequence: 'Дуже небезпечно! Ліки без рецепта можуть дуже нашкодити.',
        isSafe: false,
      },
      {
        key: 'pocket',
        label: 'Покласти в кишеню і показати потім',
        consequence: 'Краще відразу показати дорослому. Ліки небезпечні.',
        isSafe: false,
      },
    ],
  },
  {
    key: 'secretFromParents',
    ageGroups: ['grade1', 'grade2', 'grade3'],
    situation: 'Старший хлопчик просить тебе не розповідати батькам про щось, що сталося.',
    icon: '🤫',
    actions: [
      {
        key: 'tellParents',
        label: 'Розповісти батькам — секрети, що ображають або лякають, зберігати не можна',
        consequence: 'Правильно! Від батьків не треба приховувати важливі речі.',
        isSafe: true,
      },
      {
        key: 'keepSecret',
        label: 'Обіцяти нікому не говорити',
        consequence: 'Небезпечні секрети потрібно розповідати батькам.',
        isSafe: false,
      },
      {
        key: 'askFriend',
        label: 'Розповісти тільки найкращому другу',
        consequence: 'Краще розповісти батькам або вчителю, бо вони зможуть допомогти.',
        isSafe: false,
      },
    ],
  },
  {
    key: 'hotWater',
    ageGroups: ['preschool', 'grade1'],
    situation: 'Ти випадково торкнувся гарячого чайника і обпік руку.',
    icon: '♨️',
    actions: [
      {
        key: 'coldWater',
        label: 'Одразу підставити руку під холодну воду і покликати дорослого',
        consequence: 'Правильно! Холодна вода зменшує біль і допомагає при опіку.',
        isSafe: true,
      },
      {
        key: 'butter',
        label: 'Намастити маслом',
        consequence: 'Масло при опіках шкодить! Потрібна холодна вода.',
        isSafe: false,
      },
      {
        key: 'ignore',
        label: 'Нічого не робити, само пройде',
        consequence: 'Опік потребує допомоги. Одразу промий холодною водою.',
        isSafe: false,
      },
    ],
  },
  // ---------- GRADE2 / GRADE3 ----------
  {
    key: 'onlineStranger',
    ageGroups: ['grade2', 'grade3', 'grade4'],
    situation: 'Незнайомець в інтернеті питає твоє ім\'я, адресу та номер телефону батьків.',
    icon: '💻',
    actions: [
      {
        key: 'dontShare',
        label: 'Не давати особисту інформацію і розповісти батькам',
        consequence: 'Правильно! Особисті дані не можна давати незнайомцям в мережі.',
        isSafe: true,
      },
      {
        key: 'shareAll',
        label: 'Відповісти на всі запитання — може, це добрий дядько',
        consequence: 'Небезпечно! Незнайомці в інтернеті можуть бути небезпечними.',
        isSafe: false,
      },
      {
        key: 'sharePartial',
        label: 'Назвати тільки ім\'я',
        consequence: 'Навіть ім\'я та школу не треба давати незнайомцям. Розкажи батькам.',
        isSafe: false,
      },
    ],
  },
  {
    key: 'bullying',
    ageGroups: ['grade2', 'grade3', 'grade4'],
    situation: 'Однокласник постійно забирає твої речі і сміється з тебе. Тобі боляче.',
    icon: '😟',
    actions: [
      {
        key: 'tellTeacher',
        label: 'Розповісти вчителю або батькам — це булінг і дорослі можуть допомогти',
        consequence: 'Правильно! Булінг потрібно зупиняти з допомогою дорослих.',
        isSafe: true,
      },
      {
        key: 'fightBack',
        label: 'Побитися у відповідь',
        consequence: 'Це може зробити ситуацію гіршою. Краще звернутися до дорослих.',
        isSafe: false,
      },
      {
        key: 'ignore',
        label: 'Мовчати і терпіти — може, само пройде',
        consequence: 'Булінг без втручання зазвичай не припиняється. Розкажи дорослому.',
        isSafe: false,
      },
    ],
  },
  // ---------- GRADE3 / GRADE4 ----------
  {
    key: 'suspiciousPackage',
    ageGroups: ['grade3', 'grade4'],
    situation: 'Ти знайшов незнайомий пакунок у під\'їзді без підпису.',
    icon: '📦',
    actions: [
      {
        key: 'dontTouch',
        label: 'Не торкатися і одразу повідомити дорослих або зателефонувати 101',
        consequence: 'Правильно! Підозрілі предмети можуть бути небезпечними.',
        isSafe: true,
      },
      {
        key: 'open',
        label: 'Відкрити і подивитися що всередині',
        consequence: 'Дуже небезпечно! Ніколи не чіпай підозрілі предмети.',
        isSafe: false,
      },
      {
        key: 'moveIt',
        label: 'Відсунути убік, щоб не заважав',
        consequence: 'Краще не торкатися і одразу повідомити дорослих.',
        isSafe: false,
      },
    ],
  },
  {
    key: 'emergencyNumbers',
    ageGroups: ['grade1', 'grade2', 'grade3', 'grade4'],
    situation: 'Вдома стався нещасний випадок. Дорослих немає поруч. Потрібна допомога.',
    icon: '📞',
    actions: [
      {
        key: 'call112',
        label: 'Зателефонувати 112 (єдина екстрена допомога) і чітко пояснити де ти',
        consequence: 'Правильно! 112 — номер екстреної допомоги в Україні.',
        isSafe: true,
      },
      {
        key: 'wait',
        label: 'Чекати поки хтось прийде',
        consequence: 'У критичній ситуації кожна хвилина важлива. Телефонуй одразу.',
        isSafe: false,
      },
      {
        key: 'goOutside',
        label: 'Вибігти надвір і кричати',
        consequence: 'Краще зателефонувати 112 — так допомога прийде швидше.',
        isSafe: false,
      },
    ],
  },
];

export function scenariosFor(ageGroupId: AgeGroupId): SafetyScenario[] {
  return SCENARIOS.filter((s) => s.ageGroups.includes(ageGroupId));
}
