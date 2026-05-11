# DSA Motors

Интернет-магазин с фронтендом на Nuxt 3, backend на NestJS, PostgreSQL, nginx и certbot.

## Структура

- `frontend` — SSR-витрина и страницы оплаты
- `backend` — API товаров, заказов, webhook Точки
- `infra` — nginx и certbot
- `feed.csv` — исходный экспорт товаров для первичного импорта

## Быстрый старт

1. Скопируйте `.env.example` в `.env` и заполните переменные.
   Для SSR Nuxt серверные запросы к API идут через `NUXT_API_INTERNAL_BASE`, по умолчанию это `http://backend:3001/api`.
2. Настройте DNS домена на IP VPS.
3. Запустите локально или на сервере:

```bash
docker compose up --build
```

4. Для первичного выпуска сертификата выполните после настройки DNS:

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email $ACME_EMAIL --agree-tos --no-eff-email
```

5. Перезапустите nginx после выпуска сертификата:

```bash
docker compose restart nginx
```

6. Если нужно вручную переимпортировать `feed.csv` в PostgreSQL:

```bash
docker compose exec backend npm run import:feed
```

## Что уже реализовано

- Каркас Nuxt 3 storefront
- Каркас NestJS API
- Импорт товаров из `feed.csv` в PostgreSQL при пустой БД
- Создание заказа и заготовка интеграции с Точкой
- nginx reverse proxy под `frontend` и `backend`

## Что нужно доделать перед продакшеном

- Подставить боевые реквизиты Точки
- Реализовать проверку JWT вебхуков Точки публичным ключом
- Уточнить реквизиты чека 54-ФЗ с бухгалтерией
- Заменить `prisma db push` на миграции `prisma migrate deploy`
