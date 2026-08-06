# Интеграция с Naumen: транспортный слой

## Статус

Реализованы браузерный транспорт NaumenApiClient, предметные API и проектные Groovy entry-функции. Подтверждение внутренних адаптеров и сквозной работы на реальной установке Naumen отсутствует.

## Конфигурация

js/config.js содержит baseUrl, accessKey, moduleName, requestTimeout и defaultLanguage. В репозитории допустимы только placeholder-значения. Постоянный accessKey во frontend видим через DevTools и неприемлем как единственный механизм защиты.

Целевая промышленная схема:

    Browser -> Application Backend/BFF -> Naumen Service Desk

`baseUrl` — origin без `/services/rest/exec-post`; путь добавляет транспорт. `moduleName` должен
точно совпадать с опубликованным модулем, по умолчанию `modules.newItsmTest`.

## Публикация проектных функций

Сначала публикуется `CommonFunctions`, затем entry-функции Auth, Dictionary, Form/Catalog, SLA,
Request/User и в последнюю очередь fail-closed FileFunctions. До публикации каждой группы должны
быть предоставлены соответствующие project adapters. Конкретные действия импорта, регистрации и
выдачи accessKey зависят от версии Naumen и в доступной установке не проверялись.

## Вызов

Клиент выполняет только:

    POST <baseURL>/services/rest/exec-post
      ?accessKey=<technical-key>
      &func=<moduleName>.<functionName>
      &params=requestContent,user

URL создаётся через URLSearchParams. Бизнес-параметры не попадают в URL. requestId присутствует в JSON и X-Request-ID. sessionToken добавляется в JSON для защищённых запросов; auth:false отключает его. language также находится в JSON.

## Ошибки

NaumenApiError содержит kind, code, status, requestId, fieldErrors и details.

- protocol: EMPTY_RESPONSE, INVALID_JSON_RESPONSE;
- http: HTTP_ERROR либо безопасный code из error-конверта;
- business: error.code при success !== true, даже при HTTP 200;
- timeout: TIMEOUT;
- abort: REQUEST_ABORTED.

При HTTP 401, INVALID_SESSION и SESSION_EXPIRED AuthSession очищается. Переданный из `auth.js` callback `onSessionInvalid` выполняет переход на `login.html`; защищённые страницы дополнительно проверяют сессию до бизнес-рендера.

## Отмена и timeout

Для каждого запроса создаётся внутренний AbortController. options.signal связывается с ним. options.timeout переопределяет requestTimeout. Обработчики и timer удаляются в finally.

## Безопасное логирование

Debug-лог содержит только functionName, requestId и код ошибки. URL, payload, accessKey, sessionToken, login и password не журналируются.

## TODO для реального Naumen

- TODO(NAUMEN-CORS): проверить Origin, Content-Type и X-Request-ID.
- TODO(NAUMEN-HTTP): проверить реальные HTTP status и формат пустых ответов exec-post.
- TODO(NAUMEN-BODY): подтвердить передачу JSON как requestContent для params=requestContent,user.
- TODO(NAUMEN-AUTH): привязать проектные функции authLogin/authRefresh/authLogout/authGetCurrentUser к подтверждённому механизму установки.
- TODO(NAUMEN-SESSION): определить серверное хранение, TTL, отзыв и rotation.
- TODO(NAUMEN-STORAGE/PERMISSIONS/DIRECTORY/CALENDAR/TXN): подключить предметные адаптеры и проверить транзакции.
- TODO(NAUMEN-FILES): файловые функции остаются fail closed; см. `docs/naumen-files.md`.

Ни одно имя внутреннего класса или метода Naumen в клиенте не используется и не предполагается.
