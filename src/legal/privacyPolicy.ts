export type LegalSection = {
  heading?: string;
  body: string;
};

export type LegalDoc = {
  title: string;
  meta: string;
  sections: LegalSection[];
};

export const privacyPolicyUK: LegalDoc = {
  title: 'Політика конфіденційності',
  meta: 'Дата набуття чинності: 25 травня 2026 р.\nОстання редакція: 11 травня 2026 р.',
  sections: [
    {
      heading: '1. Хто ми',
      body: 'Розробник застосунку — Тарас Смалюх, фізична особа, м. Львів, Україна.\n\nКонтакт із питань конфіденційності: taras.smalych@gmail.com\nВідповідь на запити щодо даних дитини — протягом 7 календарних днів.',
    },
    {
      heading: '2. Які дані ми збираємо',
      body: 'Ми збираємо лише ті дані, які необхідні для роботи застосунку.\n\nДані батьків: email-адреса (реєстрація, відновлення паролю).\n\nПрофіль дитини (необов\'язково): ім\'я дитини, вік/рік народження, вибір аватара.\n\nІгровий прогрес: пройдені ігри, зароблені XP та бейджі, дата та час сесії.\n\nТехнічні дані: операційна система та версія застосунку, мова та регіон пристрою.\n\nЩо ми НЕ збираємо: геолокацію, контакти, фото/відео, камеру або мікрофон, рекламні ідентифікатори.',
    },
    {
      heading: '3. Чому ми збираємо ці дані',
      body: 'Email батьків — авторизація та відновлення паролю.\nПрофіль дитини — персоналізація завдань відповідно до віку.\nІгровий прогрес — збереження результатів та синхронізація між пристроями.\nТехнічні дані — виявлення та усунення технічних неполадок.\n\nПравова підстава обробки (GDPR, ст. 6(1)(a) + ст. 8): згода батьків, надана при реєстрації.',
    },
    {
      heading: '4. З ким ми ділимося даними',
      body: 'Ми не продаємо та не здаємо в оренду персональні дані.\n\nПостачальники послуг:\n• Supabase Inc. (США) — хостинг бази даних та авторизація (email батьків, профіль дитини, прогрес). Угода DPA (GDPR-сумісна).\n• Google Play — розповсюдження застосунку (білінгова інформація при покупці, якщо є).\n• GitHub Pages — хостинг веб-версії (CDN-доставка статичних файлів, без аналітики).\n\nБільше нікому дані не передаються.',
    },
    {
      heading: '5. Реклама та аналітика',
      body: 'Реклами немає — у застосунку відсутня будь-яка реклама.\nЖодних рекламних SDK.\nЖодних сторонніх аналітичних SDK (Firebase Analytics, Mixpanel тощо).',
    },
    {
      heading: '6. Як довго ми зберігаємо дані',
      body: 'Email батьків та акаунт: до видалення акаунту + 30 днів grace period.\nПрофіль дитини: до видалення акаунту + 30 днів grace period.\nІгровий прогрес: до видалення акаунту + 30 днів grace period.\nТехнічні логи: до 90 днів з дати запису.',
    },
    {
      heading: '7. Ваші права',
      body: 'Доступ до даних — запит на taras.smalych@gmail.com.\nВиправлення даних — через налаштування застосунку або email.\nВидалення акаунту — кнопка «Видалити акаунт» у розділі Налаштування або email.\nЕкспорт даних — запит на email, відповідь у форматі JSON протягом 30 днів.\nВідкликання згоди — видалення акаунту або email.\n\nНа всі запити відповідаємо протягом 7 календарних днів.',
    },
    {
      heading: '8. Захист даних',
      body: 'Шифрування при зберіганні: дані в базі Supabase зашифровані.\nШифрування при передачі: усі з\'єднання — виключно через HTTPS/TLS.\nЛокальне зберігання на пристрої: MMKV зі шифруванням.\nДоступ обмежено: тільки розробник (Тарас Смалюх) та автоматизовані сервіси Supabase.',
    },
    {
      heading: '9. Діти — особливі умови (COPPA / GDPR-K)',
      body: 'Школярик розроблений для дітей 3–10 років. Ми дотримуємося підвищених вимог захисту даних дітей.\n\nВерифікована згода батьків: реєстрацію здійснює виключно батько або опікун через email-підтвердження. Дитина не може самостійно зареєструватися.\n\nМінімальність даних: профільні дані дитини (ім\'я, вік) є необов\'язковими.\n\nВідсутність соціальних функцій: немає чату, списків друзів, публічних рекордів.\n\nВідсутність реклами: жодної реклами, жодного обміну даними з рекламними мережами.\n\nПраво батьків на видалення: Налаштування → Видалити акаунт або email.',
    },
    {
      heading: '10. Зміни до Політики',
      body: 'Про суттєві зміни повідомляємо через сповіщення в застосунку щонайменше за 30 днів до набуття чинності.',
    },
    {
      heading: '11. Контакт',
      body: 'Тарас Смалюх\nЛьвів, Україна\nEmail: taras.smalych@gmail.com\n\nВідповідь на запити щодо персональних даних дитини — протягом 7 календарних днів.',
    },
  ],
};

export const privacyPolicyEN: LegalDoc = {
  title: 'Privacy Policy',
  meta: 'Effective date: May 25, 2026\nLast updated: May 11, 2026',
  sections: [
    {
      heading: '1. Who We Are',
      body: 'Shkolyaryk is an educational mobile app for children aged 3–10, developed and operated by:\n\nTaras Smalyukh, Lviv, Ukraine\nEmail: taras.smalych@gmail.com\n\nPrivacy questions, especially about your child\'s data, receive a response within 7 days.',
    },
    {
      heading: '2. What Data We Collect',
      body: 'We collect only what is necessary to run the app.\n\nParent account: email address (login and password recovery).\n\nChild profile (optional): child\'s first name, approximate age, avatar choice.\n\nIn-app progress: games completed, XP and badges earned, completion timestamps.\n\nTechnical data: OS and app version (crash diagnostics), device locale/language.\n\nWhat we do NOT collect: geolocation, contacts, photos/videos/microphone/camera, advertising identifiers (IDFA/GAID), any data from children without parental involvement.',
    },
    {
      heading: '3. How We Use Your Data',
      body: 'Providing app functionality (login, progress sync) — performance of contract.\nCrash diagnostics — legitimate interest.\nDisplaying age-appropriate content — legitimate interest.\nComplying with COPPA/GDPR-K obligations — legal obligation.\n\nWe do not use your data for advertising, profiling, or automated decision-making.',
    },
    {
      heading: '4. Who We Share Data With',
      body: 'We share data only with the service providers listed below. We do not sell data to anyone.\n\n• Supabase — database hosting. Shared: parent email, child profile, progress. Location: EU (AWS eu-central-1). Data Processing Agreement in place.\n• Google Play / Apple App Store — app distribution. Shared: download records (managed by stores).\n• GitHub Pages — web version hosting. Shared: none (static files only).\n\nNo other third parties receive your data.',
    },
    {
      heading: '5. Advertising and Analytics',
      body: 'There is no advertising in Shkolyaryk.\n\nWe do not use any third-party analytics SDKs (Firebase Analytics, Mixpanel, Adjust) or advertising networks. There are no tracking pixels or cross-app tracking identifiers in the app.',
    },
    {
      heading: '6. Data Retention',
      body: 'Parent email and account: until you delete your account, then permanently deleted within 30 days.\nChild profile and progress: until you delete your account, then permanently deleted within 30 days.\nCrash logs / technical data: 90 days, then automatically deleted.',
    },
    {
      heading: '7. Your Rights',
      body: 'Access — email taras.smalych@gmail.com.\nCorrection — in-app Settings, or email us.\nDeletion — in-app Settings → "Delete Account", or email us.\nData portability — email request, JSON export.\nWithdraw consent — delete your account.\n\nFor COPPA-covered users (US): parents may review, correct, or delete their child\'s personal information at any time. We respond within 7 days.',
    },
    {
      heading: '8. How We Protect Your Data',
      body: 'In transit: HTTPS / TLS 1.2+ for all network communication.\nAt rest: Supabase encryption-at-rest (AES-256).\nOn device: MMKV encrypted local storage.\nAccess control: only the developer (Taras Smalyukh) has production database access.',
    },
    {
      heading: '9. Children\'s Privacy (COPPA and GDPR-K)',
      body: 'Shkolyaryk is designed for children aged 3–10. We take children\'s privacy very seriously.\n\nParental registration only: children do not register themselves. Only a parent or guardian creates an account — this constitutes verifiable parental consent under COPPA.\n\nNo social features: no chat, friend lists, user-generated content, or leaderboards.\n\nNo advertising to children: the app contains no ads of any kind.\n\nNo in-app purchases.\n\nNo behavioural profiling.\n\nParental controls: parents can view, edit, or delete their child\'s profile and progress at any time in Settings.',
    },
    {
      heading: '10. Changes to This Policy',
      body: 'If we make material changes, we will notify you inside the app at least 30 days before the changes take effect.',
    },
    {
      heading: '11. Contact',
      body: 'Taras Smalyukh\nEmail: taras.smalych@gmail.com\n\nPrivacy questions (especially regarding a child\'s data) will receive a response within 7 days.',
    },
  ],
};
