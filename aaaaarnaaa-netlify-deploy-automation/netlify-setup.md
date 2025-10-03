# 🚀 Настройка автоматического деплоя на Netlify

## 📋 Шаги для настройки

### 0. Автоматическая очистка перед билдом

- Скрипт `pnpm clean:deploy` запускается автоматически внутри `pnpm build` и удаляет локальные артефакты (`.next/`, `.history/`, `tmp_*`, `logs/`, `coverage/` и т. д.), чтобы на Netlify попадало только то, что нужно для продакшна.
- Обновлённый `.gitignore` блокирует загрузку рабочих директорий (`.artifacts`, `.qoder`, `.qodo`, `.history`, временные файлы и кеши). Проверьте, что в гите нет закоммиченных копий этих папок (при необходимости выполните `git rm -r --cached <папка>` один раз).

### 1. Подключение GitHub к Netlify

1. Зайдите на [netlify.com](https://netlify.com)
2. Нажмите "New site from Git"
3. Выберите GitHub
4. Выберите репозиторий: `Raketinlyi/aaaaarnaaa`
5. Настройте параметры сборки:
   - **Build command:** `pnpm build` *(если pnpm недоступен — установите его в разделе **Deploy settings → Build settings → Add build plugin → pnpm**, либо переключитесь на `npm run build`)*
   - **Publish directory:** `.next`
   - **Node version:** `18`

### 2. Настройка переменных окружения

В настройках сайта на Netlify добавьте (скорректируйте значения под продакшн-домен):

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXTAUTH_URL=https://aaaaarnaaa.netlify.app
NEXTAUTH_SECRET=your-secret-here
```

> **Важно:** В файле `netlify.toml` также обновите `NEXTAUTH_URL`, чтобы он совпадал с доменом Netlify.

### 3. Настройка GitHub Secrets (для автоматического деплоя)

В настройках GitHub репозитория добавьте:

1. **NETLIFY_AUTH_TOKEN** - токен из Netlify
2. **NETLIFY_SITE_ID** - ID сайта из Netlify

### 4. Получение токенов Netlify

1. В Netlify Dashboard → User Settings → Applications
2. Создайте новый Personal Access Token
3. Скопируйте токен в GitHub Secrets

### 5. Получение Site ID

1. В настройках сайта на Netlify
2. Site information → Site ID
3. Скопируйте ID в GitHub Secrets

## 🔒 Безопасность

### Заголовки безопасности уже настроены в `netlify.toml`:
- ✅ Content Security Policy
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Strict-Transport-Security
- ✅ Rate Limiting

### Автоматические проверки:
- ✅ npm audit на каждом деплое
- ✅ Безопасность зависимостей
- ✅ Проверка уязвимостей

## 🚀 Результат

После настройки:
1. Каждый push в main автоматически деплоит на Netlify
2. Все заголовки безопасности активны
3. Web3 функциональность работает
4. Максимальная защита от атак

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи сборки в Netlify
2. Убедитесь что все переменные окружения настроены
3. Проверьте что GitHub Secrets добавлены

---

**🎯 Готов к автоматическому деплою!**
