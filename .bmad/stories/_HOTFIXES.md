# Hotfixes & Ad-hoc Work — Школярик

Лог робіт що пішли в код БЕЗ повного `/sm` циклу (швидкі фікси, фідбек-ітерації).
**Цілі:** прозорість, traceability, можливість пізніше задним числом створити US якщо щось зламалось.

> Якщо хотфікс зачіпає AC існуючої US — додай посилання та перевідкрий її якщо потрібно.

## Формат
```
### YYYY-MM-DD — Короткий опис
- **Скоп:** які файли/компоненти
- **Причина:** який фідбек/баг
- **BPMN:** зачеплені M-модулі (якщо є)
- **Ризик:** що могло зламатись / що треба перевірити
```

---

### 2026-04-15 — Apple-compliant Delete Account + ConfirmModal cross-platform
- **Скоп:** `supabase/migrations/0002_delete_user_account.sql`, `src/hooks/useAuthActions.ts:deleteAccount`, `src/components/ConfirmModal.tsx` (новий), `app/(parent)/dashboard.tsx`, i18n
- **Причина:** Apple App Store guideline 5.1.1(v) + `Alert.alert` ламається на Expo Web з 3 buttons
- **BPMN:** M06 (Logout extended), cross-cutting
- **Ризик:** міграція 0002 не задеплоєна на Supabase — RPC `delete_user_account()` доки не існує в БД
- **Related US:** US-005 (логін/відновлення), US-058+ (parent panel)

### 2026-04-15 — PIN gate + lockout + forgot flow
- **Скоп:** `src/stores/pinStore.ts` (новий), `src/components/PinPad.tsx` (новий), `app/(parent)/pin-setup.tsx`, `app/(parent)/pin-gate.tsx`, `app/(parent)/pin-forgot.tsx`, `app/(parent)/_layout.tsx` (guard), i18n
- **Причина:** фідбек "завжди вимагати PIN при вході в parent mode" + M09 не реалізовано
- **BPMN:** M09 — done
- **Ризик:** djb2 hash слабкий за криптографічними стандартами (OK для child-protection PIN, не для secrets)
- **Related US:** немає (M09 був без US)

### 2026-04-15 — Parent dashboard v2: icon tabs + chart + activity + settings rows
- **Скоп:** `app/(parent)/dashboard.tsx` (повний рерайт), i18n додано stat*/tab*/weekActivity/recentActivity ключі
- **Причина:** фідбек "panель виглядає недопрацьованою" + табс зробити іконками
- **BPMN:** M54 — done
- **Ризик:** weekly chart і recent activity — placeholder mock-дані, треба підв'язати реальні (M55 sync)
- **Related US:** US-058 (parent panel)

### 2026-04-15 — Logout/Delete redirect + web fake home screen
- **Скоп:** `app/(parent)/dashboard.tsx:performLogout/performDelete`, `app/phone-home.tsx` (новий), `app/_layout.tsx` (registered phone-home + skip auth-guard)
- **Причина:** фідбек 7-9 (після logout → login, після delete → wipe + close, на web показати fake home screen)
- **BPMN:** M06, cross-cutting
- **Ризик:** на native після delete redirect у login (а не "закриття") — Apple/Google не дозволяють програмно вбити app
- **Related US:** US-005, US-058

### 2026-04-15 — Hub redesign v2: BottomTabBar + XP card + safe-area fix
- **Скоп:** `app/(main)/index.tsx` (рерайт), `src/components/BottomTabBar.tsx` (новий), `app/_layout.tsx` (initialMetrics для web), i18n hub.tab*
- **Причина:** фідбек "відцентрувати hub + bottom menu як v4" + контент перекривається фейковим notch на web
- **BPMN:** M50 (XP UI) — partial → з UI-баром
- **Ризик:** Badges/Avatar tabs disabled — екранів немає, треба US-054..US-057
- **Related US:** US-010 (Hub), US-052 (XP)

### 2026-04-19 — FormInput TS strict fix + dead route cleanup
- **Скоп:** `src/components/FormInput.tsx` (outlineStyle web-only via Platform.OS spread), видалено `app/(main)/onboarding/language.tsx`
- **Причина:** 3 pre-existing TS errors (outlineStyle не в RN types) + dead route після US-014 device-locale auto-detect
- **BPMN:** cross-cutting
- **Ризик:** мінімальний — Platform.OS gate не змінює web behavior; dead route не мав зовнішніх посилань
- **Commit:** `d6b04e1`
- **Related US:** US-014

### 2026-04-15 — Safe-area fix v2 (web notch overlap)
- **Скоп:** `app/(main)/index.tsx` — `useSafeAreaInsets()` + `Math.max(insets.top, 50)` як fallback
- **Причина:** фідбек "інформація накладається на notch", `initialMetrics` у `SafeAreaProvider` на web перебивається реальним 0-вимірюванням
- **BPMN:** cross-cutting
- **Ризик:** треба той самий патерн застосувати до інших екранів коли з'являться overlap-репорти. Альтернатива: винести в `<ScreenContainer>` wrapper.
- **Related US:** US-010

---

### 2026-06-18 — Math-only MVP scope-cut + Level Gate stars
- **Скоп:** `src/constants/islands.ts` (MVP_ISLANDS/ACTIVE_ISLANDS/isIslandActive), `app/(main)/index.tsx` (ACTIVE_ISLANDS), `app/(main)/island/[id].tsx` (гард прихованих островів), `app/(main)/game/[id].tsx` (unlock ≥2⭐/3⭐)
- **Причина:** звузити продукт до робочого зрізу під PWA-реліз + сайт-збирач фідбеку. 8 не-math островів півсирі → ховаємо. + BUG-025/026: 1⭐ відмикала наступний рівень.
- **BPMN:** навігація хабу, level-gate (cross-cutting)
- **Ризик:** інші острови ЛИШЕ приховані (флаг `MVP_ISLANDS=['math']`), не видалені — відкат однією строкою. Registry не чіпано → всі ігри ще в бандлі (оптимізація розміру later). Перевірити що deep-link на прихований острів показує "скоро".
- **Related US:** project_shk_option_a_validation (Option A SLIM)

---

## Майбутній план переходу на чистий BMAD

1. ✅ Команди `/sm`, `/dev`, `/qa`, `/pm`, `/architect` адаптовано під Школярик
2. ✅ Цей `_HOTFIXES.md` створено для traceability
3. **Наступний таск (M10 game loop або polish M50-M53)** → ОБОВ'ЯЗКОВО `/sm` спочатку
4. `/pm` — переглянути беклог US-012..US-072 і сказати які з них тепер High Priority після останніх фідбеків
