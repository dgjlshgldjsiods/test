# Интеграция с Naumen: транспортный слой

## Статус

На этапе 3 реализован только браузерный транспорт NaumenApiClient. Предметные API, серверные Groovy-функции и подтверждение работы на реальном Naumen отсутствуют.

## Конфигурация

js/config.js содержит baseUrl, accessKey, moduleName, requestTimeout и defaultLanguage. В репозитории допустимы только placeholder-значения. Постоянный accessKey во frontend видим через DevTools и неприемлем как единственный механизм защиты.

Целевая промышленная схема:

    Browser -> Application Backend/BFF -> Naumen Service Desk

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

При HTTP 401, INVALID_SESSION и SESSION_EXPIRED AuthSession очищается. Переход на login.html намеренно не реализован: это ответственность следующего этапа авторизации. При необходимости вызывающий может передать onSessionInvalid.

## Отмена и timeout

Для каждого запроса создаётся внутренний AbortController. options.signal связывается с ним. options.timeout переопределяет requestTimeout. Обработчики и timer удаляются в finally.

## Безопасное логирование

Debug-лог содержит только functionName, requestId и код ошибки. URL, payload, accessKey, sessionToken, login и password не журналируются.

## TODO для реального Naumen

- TODO(NAUMEN-CORS): проверить Origin, Content-Type и X-Request-ID.
- TODO(NAUMEN-HTTP): проверить реальные HTTP status и формат пустых ответов exec-post.
- TODO(NAUMEN-BODY): подтвердить передачу JSON как requestContent для params=requestContent,user.
- TODO(NAUMEN-AUTH): реализовать проектные функции authLogin/authRefresh/authLogout/authGetCurrentUser.
- TODO(NAUMEN-SESSION): определить серверное хранение, TTL, отзыв и rotation.

Ни одно имя внутреннего класса или метода Naumen в клиенте не используется и не предполагается.
