# 🚨 СРОЧНО: Исправление утечки секретов в Netlify

**Дата:** 3 октября 2025  
**Проблема:** Netlify обнаружил секреты в репозитории и build output

---

## ❌ Что случилось

Netlify нашёл **реальные значения** API ключей в файлах:
- `netlify-env-import.txt` — содержит ВСЕ ключи (Alchemy, WalletConnect, NEXTAUTH_SECRET)
- `FIX_NOW.txt` — Alchemy API keys
- `SECURITY_AUDIT_2025.md` — NEXTAUTH_SECRET
- `netlify.toml` — NEXTAUTH_URL и placeholder

**Почему это опасно:**
- Если эти файлы попадут в git → ключи будут в истории навсегда
- Любой с доступом к репо может украсть ваши Alchemy лимиты
- NEXTAUTH_SECRET утечёт → сессии пользователей можно подделать

---

## ✅ Что Я УЖЕ СДЕЛАЛ

1. ✅ Добавил файлы с секретами в `.gitignore`:
   - `netlify-env-import.txt`
   - `FIX_NOW.txt`
   - `SECURITY_AUDIT_2025.md`
   - `*secret*.txt`, `*keys*.txt`

2. ✅ Удалил секреты из `netlify.toml` — теперь только комментарий

3. ✅ Заменил NEXTAUTH_SECRET в `SECURITY_AUDIT_2025.md` на placeholder

---

## 🔥 Что ВАМ НУЖНО СДЕЛАТЬ ПРЯМО СЕЙЧАС (5 минут)

### Шаг 1: Проверьте что файлы с секретами НЕ в git

Выполните в терминале:

```powershell
git status
```

**Убедитесь что эти файлы показаны как "??" (untracked):**
- `netlify-env-import.txt`
- `FIX_NOW.txt`
- `SECURITY_AUDIT_2025.md`

**Если они НЕ показаны** = всё ОК (gitignore работает).

**Если показаны с "M" или "A"** = ПЛОХО → выполните:

```powershell
git reset HEAD netlify-env-import.txt FIX_NOW.txt SECURITY_AUDIT_2025.md
git restore netlify-env-import.txt FIX_NOW.txt SECURITY_AUDIT_2025.md
```

---

### Шаг 2: Сгенерируйте НОВЫЙ NEXTAUTH_SECRET

Старый секрет **СКОМПРОМЕТИРОВАН** (находится в SECURITY_AUDIT_2025.md).

**Сгенерируйте новый:**

```powershell
powershell -Command "[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))"
```

**Скопируйте результат** (например: `Abc123Def456...`) и сохраните в безопасном месте.

---

### Шаг 3: Обновите секреты в Netlify UI

1. Откройте Netlify: https://app.netlify.com/sites/aaakta/settings/deploys#environment
2. Найдите переменную **NEXTAUTH_SECRET**
3. Нажмите **Edit** и вставьте НОВЫЙ сгенерированный секрет
4. Нажмите **Save**

---

### Шаг 4: ВАЖНО — НЕ коммитьте файлы с секретами!

**НИКОГДА не коммитьте эти файлы:**
- `netlify-env-import.txt` — удалите после использования
- `FIX_NOW.txt` — удалите
- `SECURITY_AUDIT_2025.md` — храните локально, НЕ пушьте в git
- `.env`, `.env.local` — уже в gitignore

**Как безопасно работать:**
1. Все секреты храните ТОЛЬКО в Netlify UI Environment Variables
2. Локально используйте `.env.local` (он в gitignore)
3. В документации используйте placeholders: `NEXTAUTH_SECRET=your-secret-here`

---

### Шаг 5: Закоммитьте исправления

Я уже обновил `.gitignore` и `netlify.toml`. Теперь закоммитьте:

```powershell
git add .gitignore netlify.toml
git commit -m "security: remove secrets from netlify.toml and add gitignore rules"
git push origin netlify-deploy-automation
```

---

### Шаг 6: Запустите новый deploy

1. Откройте Netlify Deploys
2. Нажмите **Trigger deploy** → **Clear cache and deploy site**
3. Проверьте логи — **не должно быть** ошибок "Exposed secrets detected"

---

## 📋 Про NEXT_PUBLIC_* переменные

**Netlify жалуется на:**
- `NEXT_PUBLIC_ALCHEMY_API_KEY_1/2/3`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_MONAD_CHAIN_ID`

**Это НЕ секреты в традиционном смысле:**
- Они **должны** быть в клиентском bundle (браузер)
- `NEXT_PUBLIC_` = публичные переменные
- **НО** Alchemy keys всё равно лучше скрыть (см. Security Audit)

**Что делать:**
1. **NEXT_PUBLIC_MONAD_CHAIN_ID** — оставить как есть (chain ID публичный)
2. **NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID** — оставить (публичный проект ID)
3. **NEXT_PUBLIC_ALCHEMY_API_KEY_*** — рекомендую переместить на сервер (см. Security Audit H-1)

**Для быстрого фикса (если не хотите API route):**
- Используйте только публичные RPC (testnet бесплатный):
  ```env
  MONAD_RPC=https://testnet-rpc.monad.xyz
  ```
- Удалите `NEXT_PUBLIC_ALCHEMY_API_KEY_*` из Netlify env vars

---

## ⚠️ Если репо публичный на GitHub

**КРИТИЧНО:** Если ваш репо публичный И вы уже пушили эти файлы → секреты в истории git.

**Решение:**
1. Смените ВСЕ ключи:
   - Сгенерируйте новый NEXTAUTH_SECRET ✅ (уже сделали)
   - Создайте новые Alchemy API keys на https://dashboard.alchemy.com
   - Обновите NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (если нужно)

2. Почистите git историю (advanced):
   ```powershell
   # Установите BFG Repo-Cleaner
   # https://rtyley.github.io/bfg-repo-cleaner/
   
   # Создайте файл replacements.txt:
   # cj0mWZ2tyzzr5e+F6NN5OlrTl8GQnCMKDxP5G0LXre9R74lL3L2T6ymzF3yNmIdj==>***REMOVED***
   # XgKXPDCwM8SYsWDPk1yCs==>***REMOVED***
   # 2IQm_LTSDvuAdUJ9rBrgd==>***REMOVED***
   # HV4pb99WrMhI_L2dI7wg0==>***REMOVED***
   
   bfg --replace-text replacements.txt
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```

---

## ✅ Checklist финальной проверки

После всех шагов проверьте:

- [ ] `git status` — файлы с секретами НЕ tracked
- [ ] Netlify env vars обновлены (новый NEXTAUTH_SECRET)
- [ ] `netlify.toml` НЕ содержит реальных секретов
- [ ] Новый deploy прошёл БЕЗ "Exposed secrets detected"
- [ ] Сайт работает (NextAuth сессии валидны с новым секретом)

---

## 📞 Итого

**Что НЕ НУЖНО делать:**
- ❌ Коммитить `netlify-env-import.txt`, `FIX_NOW.txt`
- ❌ Хранить секреты в `netlify.toml` или любых .md файлах
- ❌ Пушить файлы со значениями API keys

**Что НУЖНО делать:**
- ✅ Все секреты → Netlify UI Environment Variables
- ✅ Локально → `.env.local` (в gitignore)
- ✅ В документации → placeholders (`your-secret-here`)
- ✅ Регулярно ротация ключей (особенно если утечка)

---

**Время на фикс:** ~5 минут  
**Статус:** 🔴 Критично (но легко исправить)
