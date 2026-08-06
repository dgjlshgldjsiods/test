# ITSM frontend prototype

Статический многостраничный frontend-прототип ITSM без npm, сборщика и frontend-фреймворков.

## Текущий статус

Реализованы 10 HTML-страниц, общий интерфейс, NaumenApiClient, сессия и роли, локализация и темы,
формы и их версии, каталог, заявки, профиль и SLA. Серверные Groovy-файлы задают проектные
entry-функции и адаптерные границы.

Сквозная работа с реальной установкой Naumen не подтверждена: `js/config.js` содержит placeholders,
а внутренние Authentication/Session/Repository/Directory/Calendar адаптеры требуют привязки.
Файловая интеграция намеренно работает в fail-closed режиме. Итоги полной проверки приведены в
`docs/final-audit.md`.

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
- docs/final-audit.md
