# ITSM frontend prototype

Статический многостраничный frontend-прототип каталога услуг и обработки заявок для интеграции с
Naumen Service Desk. Проект демонстрирует клиентскую архитектуру и проектные серверные контракты,
но не является готовой подтверждённой интеграцией с конкретной установкой Naumen.

## Возможности

- каталог услуг и создание заявки по опубликованной версии формы;
- список и карточка заявок, комментарии, назначения, история и SLA;
- административные редакторы каталога, версий SurveyJS-форм и SLA;
- профиль пользователя, роли, RU/EN и светлая/тёмная темы;
- единый POST-транспорт `NaumenApiClient`, optimistic locking и browser unit-тесты;
- fail-closed интерфейс файлов: загрузка и скачивание отключены до проверки API установки.

## Технологии

- HTML5, CSS и браузерные JavaScript ES-модули без сборщика;
- Bootstrap 5.3.3;
- SurveyJS Form Library и SurveyJS Creator;
- QUnit 2.24.1;
- проектные Groovy entry-функции для модуля Naumen.

Node.js/npm не нужны для запуска приложения. SurveyJS Creator требует соответствующей лицензии.

## Структура

    admin/       административные HTML-страницы
    css/         общие стили, темы и стили страниц
    docs/        архитектура, REST, безопасность, запуск и аудит
    groovy/      проектные entry-функции и границы адаптеров Naumen
    js/api/      транспорт и предметные API-модули
    js/core/     сессия, права, темы, i18n и чистая бизнес-логика
    js/components/ переиспользуемые UI-компоненты
    js/pages/    контроллеры 10 страниц
    tests/       browser QUnit tests и test runner

Полная модель слоёв и дерева: `docs/architecture.md`.

## Конфигурация

Перед подключением к стенду отредактируйте `js/config.js`:

    window.ITSM_CONFIG = Object.freeze({
      baseUrl: 'https://naumen.example.test',
      accessKey: 'replace-with-access-key',
      moduleName: 'modules.newItsmTest',
      requestTimeout: 30000,
      debug: false,
      defaultLanguage: 'ru',
      defaultTheme: 'light',
      sessionStorageKey: 'itsm.session',
      languageStorageKey: 'itsm.language',
      themeStorageKey: 'itsm.theme'
    });

- `baseUrl` — origin установки без завершающего `/`; endpoint добавляет клиент.
- `accessKey` — технический ключ доступа к `exec-post`, не пользовательская авторизация.
- `moduleName` — имя опубликованного модуля; по умолчанию `modules.newItsmTest`.
- `requestTimeout` — timeout запроса в миллисекундах.

Реальные параметры текущей установки в репозитории отсутствуют. Работа с Naumen не была
проверена на реальном сервере.

## Публикация Groovy-функций

Точная процедура импорта зависит от версии и настроек Naumen и должна быть подтверждена
администратором установки. Рекомендуемый порядок зависимостей проекта:

1. `groovy/CommonFunctions.groovy`.
2. `groovy/AuthFunctions.groovy` — после настройки AuthenticationAdapter, SessionRepository и PermissionAdapter.
3. `groovy/DictionaryFunctions.groovy`.
4. `groovy/FormFunctions.groovy` и `groovy/CatalogFunctions.groovy`.
5. `groovy/SlaFunctions.groovy`.
6. `groovy/RequestFunctions.groovy` и `groovy/UserFunctions.groovy`.
7. `groovy/FileFunctions.groovy` — остаётся fail closed до подтверждения FileAdapter.

Entry-функции должны быть опубликованы под именами `modules.newItsmTest.<functionName>` либо под
другим `moduleName`, одновременно указанным в `config.js`. Имена Repository/Adapter в Groovy —
проектные интерфейсы, а не гарантированные встроенные API Naumen.

## Запуск

Из корня проекта:

    python3 -m http.server 8000

Откройте `http://localhost:8000/login.html`. Запуск через `file://` не поддерживается из-за
браузерных ES-модулей. Bootstrap подключён с jsDelivr; SurveyJS — с unpkg. Для production
зависимости необходимо зафиксировать, проверить по лицензии/хешам и предпочтительно разместить
same-origin. Подробнее: `docs/running.md`.

## Unit-тесты

При работающем статическом сервере откройте:

    http://localhost:8000/tests/test-runner.html

Тесты используют QUnit в браузере. Подмена глобального `fetch` применяется только в unit-тестах
транспорта и не является mock-сервером приложения.

## Страницы

| Страница | Назначение |
|---|---|
| `login.html` | вход |
| `service-catalog.html` | пользовательский каталог |
| `service-form.html?serviceId=...` | создание заявки |
| `requests.html` | список заявок |
| `request-card.html?id=...` | карточка заявки |
| `profile.html` / `profile.html?id=...` | профиль |
| `admin/catalog-editor.html` | редактор каталога |
| `admin/forms.html` | список форм |
| `admin/form-editor.html` | редактор и версии форм |
| `admin/sla-editor.html` | редактор SLA |

## Роли

- `USER` — каталог, создание и доступные заявки, собственный профиль;
- `OPERATOR` — обработка доступных назначенных заявок;
- `CATALOG_ADMIN` — каталог и услуги;
- `FORM_ADMIN` — формы и версии;
- `SLA_ADMIN` — SLA-правила;
- `SYSTEM_ADMIN` — все права.

Роли суммируются. Frontend скрывает недоступные элементы только для UX; окончательное решение
обязательно принимает сервер. Полная матрица: `docs/permissions.md`.

## Безопасность accessKey

`accessKey`, размещённый в frontend, виден в DevTools и исходном коде страницы. Он не является
секретом, не подтверждает личность пользователя и не должен давать доступ без sessionToken,
server-side permission и object-scope checks. Реальный пароль, sessionToken и production-ключи
нельзя коммитить или логировать.

Для промышленной эксплуатации рекомендуется схема:

    Browser -> Application Backend/BFF -> Naumen Service Desk

BFF хранит accessKey вне браузера, ограничивает Origin/rate limits, выполняет серверную
авторизацию и выдаёт защищённую HttpOnly/Secure/SameSite cookie с CSRF-защитой.

## Известные ограничения

- сквозная интеграция с реальным Naumen не проверена;
- Authentication/Session/Permission/Repository/Directory/Calendar/Audit adapters требуют привязки;
- файловый API не подтверждён, загрузка и скачивание отключены;
- SurveyJS URL не закреплены версией и не имеют SRI;
- CORS, TLS, CSP, security headers, реальные транзакции и rate limiting локально не проверены;
- постоянный accessKey во frontend неприемлем для production.

Обязательные действия перед production и фактические результаты проверок приведены в
`docs/final-audit.md`. Файловый чек-лист — в `docs/naumen-files.md`.

## Документация

- `docs/requirements.md` — исходные требования;
- `docs/architecture.md` — слои, модели и инварианты;
- `docs/rest-api.md` — проектные REST-контракты;
- `docs/permissions.md` — роли и объектные права;
- `docs/security.md` — модель угроз и меры защиты;
- `docs/running.md` — локальный запуск и диагностика;
- `docs/naumen-integration.md` — транспорт и точки интеграции;
- `docs/final-audit.md` — результаты технического аудита.
