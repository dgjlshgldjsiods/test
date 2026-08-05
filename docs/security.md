# Безопасность

Документ задает обязательные меры для прототипа и отмечает ограничения архитектуры Browser → Naumen.

## 1. Границы доверия

Недоверенные данные: URL/query/hash, localStorage, SurveyJS schema и values, ответы/ошибки сервера, имена и MIME файлов, поля фильтра/сортировки, идентификаторы и роли из браузера.

Доверенное решение принимает сервер после проверки сессии, актуальных ролей и объекта. NaumenApiClient — транспортная граница frontend. Groovy entry functions — входная серверная граница. Все внутренние Naumen API находятся за проектными адаптерами.

## 2. Секреты и сессии

- Реальные baseUrl, accessKey, sessionToken и пароли не коммитятся и не логируются.
- accessKey видим пользователю, потому что находится во frontend; поэтому он не является средством пользовательской авторизации.
- Промышленная целевая схема: Browser → Application Backend/BFF → Naumen. BFF хранит accessKey вне браузера, ограничивает CORS/rate и выдает защищенную cookie.
- В прототипе sessionToken хранится в localStorage по явному требованию. Это повышает ущерб от XSS.
- Токен непрозрачен, криптографически случаен, имеет ограниченный TTL, отзывается при logout; сервер хранит digest.
- sessionToken никогда не передается в URL или Authorization Bearer.
- Пароль существует только в памяти на время login, не сохраняется и очищается из формы после ответа.
- Refresh policy и rotation: TODO(NAUMEN-SESSION).
- Защищенные страницы проверяют expiresAt до рендера; сервер проверяет каждую операцию.

## 3. XSS и DOM

- Обычный текст выводится через textContent/createTextNode.
- innerHTML запрещен для данных сервера и пользователя. Если библиотека требует HTML, используется отдельный sanitizer с фиксированной политикой; выбор библиотеки — TODO.
- URL атрибуты строятся через URL и allowlist схем http/https при необходимости. javascript:, data: и произвольные внешние источники запрещены.
- Иконки услуги — только идентификатор из allowlist или проверенный same-origin asset, не произвольный HTML/SVG.
- CSP для статического хоста: default-src 'self'; script-src 'self'; style-src 'self' (с согласованным исключением Bootstrap при локальном vendor); img-src 'self' data:; connect-src только Naumen origin; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'. Точная политика зависит от размещения SurveyJS и Naumen: TODO(CSP-DEPLOYMENT).
- Добавить Referrer-Policy: no-referrer и X-Content-Type-Options: nosniff на хосте.

## 4. SurveyJS

- Schema рассматривается как недоверенный документ.
- До рендера и сохранения применяется структурная валидация: allowlist типов вопросов, свойств, expression operators/functions и dictionaryCode.
- Запрещены произвольный JavaScript, eval, Function, event handlers, HTML-вставки и загрузка choicesByUrl/внешних URL.
- Динамические справочники доступны только через dictionaries-api и серверный allowlist.
- Сервер повторно загружает неизменяемую formVersion, проверяет только объявленные поля, типы, required/visible rules и допустимые значения.
- TODO(SURVEY-EXPRESSIONS): утвердить точный поднабор expression engine и защиту от чрезмерно сложных выражений.

## 5. CSRF, CORS и транспорт

При sessionToken в JSON и без cookie классический CSRF ограничен, но accessKey остается публичным. Naumen должен иметь точный allowlist Origin и не использовать wildcard с credentials. Только HTTPS. Не включать секреты в redirect, referrer и сообщения ошибок.

Если появится BFF с cookie, обязательны HttpOnly, Secure, SameSite и CSRF-token/origin checks. Настройки CORS и возможность заголовка X-Request-ID требуют проверки на реальном размещении: TODO(NAUMEN-CORS).

## 6. Авторизация и IDOR

Каждый endpoint проверяет session → action → object. Нельзя принимать authorId, roles, organizationIds или groupIds как доказательство прав. Любой entityId проверяется в server-side scope. Доступность услуги повторно проверяется в requestsCreate. Внутренние комментарии фильтруются сервером. Для недоступных объектов не раскрывается чувствительная информация.

Матрица находится в docs/permissions.md. Реальное сопоставление ACL: TODO(NAUMEN-PERMISSIONS).

## 7. Валидация, injection и DoS

- JSON имеет лимит размера, глубины, длины строк и количества элементов.
- pageSize, sort.field, filter fields, dictionaryCode, SLA field/operator и status проверяются allowlist.
- Проект не формирует SQL во frontend. Adapter не должен собирать запросы конкатенацией.
- SLA expressions декларативны; произвольный код запрещен.
- Ограничиваются частота login, search, upload и тяжелых SLA checks; детали rate limiting — TODO(DEPLOYMENT-RATE-LIMIT).
- Таймаут клиента не отменяет серверную транзакцию, поэтому create/upload используют idempotency requestId.
- Ошибки не содержат stack trace, внутренние классы, пути или сырые ответы Naumen.

## 8. Вложения

До проверки реального Naumen FileAdapter не объявляется рабочим.

Обязательные меры:

1. Серверный лимит encoded и decoded размера.
2. Нормализация имени, удаление пути и управляющих символов; генерируемое storage name.
3. Проверка расширения, заявленного MIME и magic bytes; allowlist.
4. Запрет HTML/SVG/скриптов по умолчанию.
5. Проверка прав на заявку до upload/read/delete.
6. Content-Disposition: attachment и nosniff при скачивании.
7. Антивирус/карантин, если инфраструктура доступна — TODO(NAUMEN-FILES).
8. Base64 только для малого лимита; streaming/multipart — после проверки API.
9. Хеш содержимого для целостности/дедупликации при необходимости.
10. Аудит upload/delete без содержимого файла.

## 9. Optimistic locking и повторная отправка

- Все mutable entity имеют version; команды передают expectedVersion.
- Сервер атомарно сравнивает и меняет, иначе VERSION_CONFLICT.
- Кнопка блокируется во время запроса, но это только UX.
- requestsCreate и filesUpload используют requestId как idempotency key. Повтор возвращает исходный результат или DUPLICATE, но не создает вторую сущность.
- Срок хранения ключей и семантика retry: TODO(IDEMPOTENCY).
- Публикация версии формы и reorder SLA транзакционны: TODO(NAUMEN-TXN).

## 10. Логирование и аудит

Можно логировать requestId, functionName, безопасный код результата, duration, actorId и entity reference. Запрещены password, sessionToken, accessKey, file content, полные fieldValues и конфиденциальные поля. Клиентский debug logger использует redaction по ключам и отключен в production.

Аудируются login outcome без пароля, logout, access denial, изменения каталога/форм/SLA/заявок, комментарии и вложения. Срок хранения, доступ к журналу и персональные данные: TODO(AUDIT-POLICY).

## 11. Зависимости и поставка

- Bootstrap, SurveyJS и QUnit фиксируются по версии и хранятся локально в vendor.
- Проверяются лицензии, checksums и источник артефактов.
- Автоматической подмены API mock-данными нет.
- config.js содержит только placeholders. Для среды конфигурация поставляется отдельно; доступ к ней не делает accessKey секретом.
- Статический сервер отдает корректные MIME для ES modules и security headers.
- Обновления зависимостей проходят review и smoke/unit tests.

## 12. Проверки безопасности перед выпуском

- Поиск fetch вне единственного транспорта.
- Поиск секретов и реальных адресов.
- Тесты business error при HTTP 200, timeout, invalid JSON, 401, SESSION_EXPIRED и INVALID_SESSION.
- Тесты permission/object scopes и отказа при подмене id.
- XSS-набор для всех серверных строк и Survey schema.
- Проверка allowlist сортировки, фильтров, dictionaryCode и SLA operators.
- Тесты upload polyglot/double extension/oversize/path traversal.
- Тест concurrent update/publish/reorder и duplicate create.
- Проверка CSP/CORS/TLS/security headers в целевой среде.
- Проверка TODO(NAUMEN-*) на реальном стенде до заявления о работоспособности.
