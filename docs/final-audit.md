# Финальный технический аудит

Дата проверки: 2026-08-06. Объект: статический ITSM-прототип, этапы 1–15.

## Результат

Проект содержит ровно 10 требуемых HTML-страниц и запускается статическим HTTP-сервером без
сборки. Локальные CSS/JavaScript-ссылки и относительные пути admin-страниц разрешаются корректно.
Все защищённые страницы без сессии переходят на login до бизнес-рендера. Browser QUnit runner
выполнил 66 тестов и 142 утверждения без ошибок.

Аудит не подтверждает работоспособность на реальной установке Naumen: в репозитории находятся
только placeholder baseUrl/accessKey, а внутренние адаптеры не привязаны к установке.

## Проверенные области

| Область | Результат |
|---|---|
| 10 HTML-страниц | Найдены все 10; каждая открыта через `python3 -m http.server` |
| Относительные пути | 0 отсутствующих локальных `src`/`href`; admin использует `../` |
| ES-модули | 59 JS-файлов прошли syntax/import-path check; page scripts имеют `type=module` |
| HTTP-транспорт | Единственный `fetch` — `js/api/naumen-api-client.js`; только POST exec-post |
| Query string | Только accessKey, func, params; business payload, language и sessionToken находятся в JSON |
| Секреты | Реальных ключей/паролей/токенов не найдено; config содержит placeholders |
| Сессия | HTTP 401, SESSION_EXPIRED и INVALID_SESSION очищают AuthSession и вызывают login redirect |
| Роли | PAGE_ROLES, SYSTEM_ADMIN inheritance, меню и server-side role checks согласованы |
| Состояния | Общие loading/empty/error/forbidden используются страницами и route guard |
| Локализация | RU/EN unit-тесты; переключение страницы входа фактически проверено |
| Темы | light/dark применяются до рендера; фактическое переключение на dark проверено |
| XSS | Основные серверные строки выводятся через textContent; Survey schema имеет allowlist |
| Повторная отправка | Login, request create, comments, assignment, profile и form commands блокируют submit; requestId обеспечивает проектную идемпотентность create |
| Формы | Единственный DRAFT, immutable published/old versions, server version number и VERSION_CONFLICT покрыты тестами |
| SLA | Все операторы, порядок, первое/все совпадения и приблизительные конфликты покрыты тестами; сервер остаётся источником истины |
| Groovy | Все Groovy-файлы компилируются совместно |
| Дублирование | Точных дублей JS/CSS по содержимому не найдено; общие UI-функции вынесены в components/core |
| Неиспользуемые файлы | Не найдено недостижимых page-модулей; config.js и theme-bootstrap.js намеренно подключаются HTML как classic scripts |

## Исправления аудита

1. Статус услуги, полученный с сервера, больше не интерполируется в `innerHTML`; используется
   `textContent`.
2. `SlaFunctions` приведён к общему SessionRepository/PermissionAdapter контракту:
   `findActiveByToken`, expiry/revoke, `rolesForUser`, SLA_ADMIN/SYSTEM_ADMIN.
3. README и архитектура актуализированы: реализованные вертикали больше не описываются как заглушки.
4. Документ интеграции отражает фактический login redirect при invalid session.
5. Документация запуска и безопасности теперь честно описывает CDN и незакреплённые SurveyJS URL.

## Непроверенные интеграции Naumen

- AuthenticationAdapter: реальная проверка учётных данных.
- SessionRepository: хранилище, TTL, digest, отзыв, rotation и идемпотентность.
- PermissionAdapter: роли, ACL и объектные права.
- CatalogRepository/FormRepository/RequestRepository/UserRepository/SlaRepository: классы,
  атрибуты, запросы, optimistic locking и транзакции.
- DirectoryAdapter: пользователи, группы, организации, подразделения и словари.
- CalendarAdapter: рабочие интервалы, праздники, часовые пояса и дедлайны.
- FileAdapter: upload/read/download/delete, ACL, лимиты, MIME/magic bytes и антивирус; сейчас fail closed.
- AuditAdapter: формат, срок хранения и доступ к журналу.
- exec-post: CORS, X-Request-ID, JSON requestContent, HTTP statuses и реальные error envelopes.

## TODO и известные ограничения

- TODO(NAUMEN-AUTH/STORAGE/SESSION/PERMISSIONS/CATALOG/DIRECTORY/CALENDAR/FILES/TXN/HTTP/CORS).
- TODO(REQUEST-VISIBILITY), TODO(PROFILE-EDIT), TODO(IDEMPOTENCY), TODO(SLA-DEFAULT).
- TODO(SURVEY-EXPRESSIONS): production allowlist и ограничение сложности выражений.
- SurveyJS URL не закреплены версией и не имеют SRI; offline/воспроизводимый запуск не гарантирован.
- Bootstrap/SurveyJS загружаются извне, поэтому строгий production CSP пока не применим без
  локального размещения или утверждённых CDN origins/hashes.
- XSS-проверка была статической и unit-based; отдельный browser fuzz-набор всех DTO отсутствует.
- Конкурентные транзакции, rate limiting, TLS, CORS, CSP и security headers нельзя проверить на
  простом локальном HTTP-сервере.

## Обязательные действия перед production

1. Развернуть тестовую Naumen-среду и закрыть все TODO(NAUMEN-*), зафиксировав реальные adapter
   contracts и end-to-end тесты.
2. Перенести accessKey из браузера в BFF; использовать HTTPS и защищённую HttpOnly/Secure/SameSite
   сессию с CSRF/Origin защитой.
3. Зафиксировать и лицензировать SurveyJS/Bootstrap/QUnit, проверить hashes и разместить same-origin
   либо настроить строгий CSP с SRI.
4. Выполнить security-тесты ACL/IDOR, XSS fuzz, CORS/CSRF, rate limits, журналирование без секретов,
   concurrent updates и идемпотентные retries.
5. Подтвердить транзакции публикации форм, reorder SLA, создания/изменения заявки и истории.
6. Утвердить backup/restore, мониторинг, retention персональных данных и incident response.
7. Не включать вложения до выполнения чек-листа `docs/naumen-files.md`.
