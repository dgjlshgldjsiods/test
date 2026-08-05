# ITSM frontend prototype

Статический многостраничный frontend-прототип ITSM без npm, сборщика и frontend-фреймворков.

## Текущий этап

Реализован только базовый UI-каркас:

- 10 отдельных HTML-страниц;
- общий Bootstrap layout, navbar и sidebar;
- переиспользуемые состояния loading, empty, error и forbidden;
- общие modal и toast;
- пустые ES-module контроллеры страниц;
- конфигурация с безопасными placeholder-значениями.

Не реализованы REST, NaumenApiClient, авторизация, каталог, формы, заявки, SLA и Groovy-функции.

## Запуск

Подробности: docs/running.md.

    python3 -m http.server 8000

После запуска открыть http://localhost:8000/login.html.

## Документация

- docs/requirements.md
- docs/architecture.md
- docs/rest-api.md
- docs/permissions.md
- docs/security.md
- docs/running.md
