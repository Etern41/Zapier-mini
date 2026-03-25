# AutoFlow (mini-Zapier)

Платформа автоматизации workflow: Next.js 14, PostgreSQL + Prisma, NextAuth (credentials), BullMQ + Redis, React Flow, расписание (node-cron в worker), вебхуки, шаги HTTP / Email / Telegram / SQL / Transform.

## Требования

- Node.js 18+
- PostgreSQL
- Redis (например Upstash; переменная `UPSTASH_REDIS_URL`)

## Настройка

1. Скопируйте `.env.example` в `.env` и заполните переменные.
2. Примените схему к БД:

```bash
npx prisma db push
```

3. Установите зависимости и запустите приложение:

```bash
npm install
npm run dev
```

4. В отдельном терминале запустите worker (очередь + cron + опрос IMAP):

```bash
npm run worker
```

Без worker вебхуки ставят задачи в очередь, но выполнение не произойдёт до запуска воркера.

## Переменные окружения

См. `.env.example`. Обязательно: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `UPSTASH_REDIS_URL` для полного цикла.

## Документация API

- Интерактивно: `/api/docs`
- JSON: `/api/openapi.json`

## Деплой (Vercel)

Next.js приложение можно задеплоить на Vercel; **worker** (`npm run worker`) нужно запускать отдельно (VPS, Railway, Render и т.д.) с теми же переменными окружения и доступом к Redis и PostgreSQL.
