# REST API прототипа ITSM

Статус: проектный контракт. Имена функций modules.newItsmTest.* — функции, которые предстоит реализовать в проекте; они не являются встроенными API Naumen. Внутренние вызовы Naumen скрыты за адаптерами и отмечаются TODO.

## 1. Транспорт

Все операции:

    POST <baseURL>/services/rest/exec-post
      ?accessKey=<technical-key>
      &func=modules.newItsmTest.<functionName>
      &params=requestContent,user

Query string содержит только accessKey, func, params. Заголовки: Content-Type: application/json; charset=UTF-8, Accept: application/json, X-Request-ID. Бизнес-параметры, login, password и sessionToken передаются только в JSON.

NaumenApiClient автоматически добавляет requestId, language и для защищенных вызовов sessionToken. authLogin использует auth:false. HTTP 200 не означает бизнес-успех.

Реализация этапа 3 находится в js/api/naumen-api-client.js. Транспорт не выполняет навигацию и не знает предметных API. При HTTP 401, INVALID_SESSION и SESSION_EXPIRED он очищает AuthSession и может вызвать переданный callback onSessionInvalid; перенаправление относится к этапу авторизации.

Типизированная ошибка NaumenApiError содержит kind, code, status, requestId, fieldErrors и details. Транспортные коды клиента: EMPTY_RESPONSE, INVALID_JSON_RESPONSE, HTTP_ERROR, BUSINESS_ERROR, TIMEOUT и REQUEST_ABORTED.

## 2. Конверты

Успех:

    {
      "success": true,
      "data": {},
      "requestId": "uuid"
    }

Ошибка:

    {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Локализованное безопасное сообщение",
        "fieldErrors": {},
        "details": []
      },
      "requestId": "uuid"
    }

Коды: VALIDATION_ERROR, INVALID_CREDENTIALS, INVALID_SESSION, SESSION_EXPIRED, FORBIDDEN, NOT_FOUND, VERSION_CONFLICT, DUPLICATE, DEPENDENCY_EXISTS, SLA_NOT_FOUND, FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE, INTERNAL_ERROR.

HTTP: 2xx допустим для любого корректно обработанного бизнес-ответа Naumen; если платформа позволяет, рекомендуются 400 для синтаксической ошибки, 401 для сессии, 403, 404, 409, 413 и 500. Клиент всегда ориентируется и на error.code.

## 3. Общие DTO

Списочный запрос:

    {
      "page": 1,
      "pageSize": 20,
      "filters": {},
      "sort": [{"field":"updatedAt","direction":"desc"}]
    }

Списочный результат:

    {
      "items": [],
      "page": 1,
      "pageSize": 20,
      "total": 0,
      "totalPages": 0
    }

Команда изменения:

    {
      "entityId": "type$id",
      "expectedVersion": 4
    }

Сервер применяет allowlist полей фильтрации/сортировки и ограничивает pageSize до 100.

## 4. Реестр функций и контракты

Общие поля requestId, language и sessionToken ниже не повторяются. Все функции защищены, кроме authLogin.

### Аутентификация

| Функция | Запрос | data |
|---|---|---|
| authLogin | login, password | sessionToken, expiresAt, user |
| authLogout | — | loggedOut:true |
| authRefresh | — | sessionToken, expiresAt |
| authGetCurrentUser | — | user, expiresAt |

TODO(NAUMEN-AUTH): AuthenticationAdapter. TODO(NAUMEN-SESSION): SessionRepository и политика refresh/rotation.

### Каталог

| Функция | Запрос | data |
|---|---|---|
| catalogGetTree | includeArchived, includeDrafts | folders[], services[] |
| catalogGetAvailableTree | search? | опубликованные доступные folders[], services[] |
| catalogGetFolder | folderId | folder |
| catalogCreateFolder | folder | folder |
| catalogUpdateFolder | folderId, changes, expectedVersion | folder |
| catalogDeleteFolder | folderId, expectedVersion | deleted:true |
| catalogGetServices | page/pageSize/filters/sort | PageResult<Service> |
| catalogGetService | serviceId | service |
| catalogCreateService | service | service |
| catalogUpdateService | serviceId, changes, expectedVersion | service |
| catalogMoveService | serviceId, targetFolderId, expectedVersion | service |
| catalogChangeServiceStatus | serviceId, status, expectedVersion | service |
| catalogGetServiceAvailability | serviceId | availability |
| catalogUpdateServiceAvailability | serviceId, availability, expectedVersion | service |

Сервер проверяет отсутствие потомков перед удалением папки; уникальность code; существование папки; совместимость formId/formVersionId; опубликованность выбранной версии при публикации услуги; принадлежность assignee группе; доступность при чтении и создании заявки.

Пример availability:

    {
      "mode": "RESTRICTED",
      "userIds": ["employee$1"],
      "departmentIds": ["department$1"],
      "organizationIds": ["organization$1"]
    }

TODO(NAUMEN-STORAGE), TODO(NAUMEN-DIRECTORY).

### Формы и версии

| Функция | Запрос | data |
|---|---|---|
| formsGetList | page/pageSize/filters/sort | PageResult<Form> |
| formsGet | formId | form |
| formsCreate | form, initialSchema | form, draftVersion |
| formsUpdate | formId, changes, expectedVersion | form |
| formsGetVersions | formId, page/pageSize | PageResult<FormVersion> |
| formsGetVersion | formVersionId | formVersion |
| formsCreateVersion | formId, sourceVersionId?, schema?, expectedFormVersion | draftVersion |
| formsCloneVersion | formId, sourceVersionId, expectedFormVersion | draftVersion |
| formsSaveDraft | formId, formVersionId, schema, expectedVersion | draftVersion |
| formsPublishVersion | formId, formVersionId, expectedVersion | form, publishedVersion |

formsCreateVersion/Clone назначают versionNumber на сервере. Save разрешен только активному DRAFT. Publish валидирует безопасную schema и выполняется атомарно. VERSION_CONFLICT возвращается и при конкурирующем создании второго DRAFT.

На этапе 6 реализованы только read-only функции formsGetList, formsGet и formsGetVersions. Их Groovy-код использует проектный formRepository; конкретное хранение Naumen остаётся TODO(NAUMEN-FORMS).

Запрос formsGetList:

    {
      "page": 1,
      "pageSize": 20,
      "filters": {
        "search": "incident",
        "statuses": ["DRAFT", "PUBLISHED", "ARCHIVED"]
      },
      "sort": [{"field": "updatedAt", "direction": "desc"}]
    }

Разрешённые поля сортировки этапа: code, title, status, updatedAt. Поиск title/code, фильтрация, сортировка и пагинация выполняются серверным адаптером. Максимальный pageSize — 100. Form summary должен содержать id, code, title, status, currentPublishedVersion, activeDraftVersion и updatedAt. Ответ — общий PageResult<Form>.

formsGet принимает formId. formsGetVersions принимает formId, page и pageSize и возвращает PageResult<FormVersion>. Все три функции требуют FORM_ADMIN или SYSTEM_ADMIN.

TODO(SURVEY-EXPRESSIONS), TODO(NAUMEN-TXN).

### Заявки

| Функция | Запрос | data |
|---|---|---|
| requestsGetList | page/pageSize/filters/sort/scope? | PageResult<RequestSummary> |
| requestsCreate | serviceId, formId, formVersionId, fieldValues, attachmentIds? | request |
| requestsGet | entityId | request, service, formVersion |
| requestsChangeStatus | entityId, newStatus, comment?, expectedVersion | request |
| requestsChangeAssignment | entityId, responsibleGroupId, assigneeId?, expectedVersion | request |
| requestsAddComment | entityId, comment:{type,text}, expectedVersion? | comment |
| requestsGetComments | entityId, page/pageSize | PageResult<Comment> |
| requestsGetHistory | entityId, page/pageSize | PageResult<HistoryEvent> |
| requestsGetAttachments | entityId | attachments[] |
| requestsAddAttachment | entityId, file/temporaryFileId, expectedVersion? | attachment |
| requestsGetSla | entityId | requestSla |
| requestsRecalculateSla | entityId, reason, expectedVersion | requestSla |

requestsCreate использует requestId как idempotency key. Сервер заново проверяет услугу, доступность, конкретную опубликованную версию, allowlist полей, обязательность, типы, requestedFor и вложения. fieldValues не превращаются в произвольные имена атрибутов без schema mapping в RequestRepository.

requestsGetList применяет объектный scope на сервере. Клиентский scope — подсказка и не расширяет доступ.

TODO(REQUEST-VISIBILITY), TODO(NAUMEN-STORAGE), TODO(IDEMPOTENCY).

### SLA и календари

| Функция | Запрос | data |
|---|---|---|
| slaGetRules | serviceId?, includeDisabled, page/pageSize | PageResult<SlaRule> |
| slaGetRule | ruleId | rule |
| slaCreateRule | rule | rule |
| slaUpdateRule | ruleId, changes, expectedVersion | rule |
| slaDeleteRule | ruleId, expectedVersion | deleted:true |
| slaReorderRules | serviceId?, ruleIds[], expectedVersion | rulesVersion, rules[] |
| slaTestRules | context, rules? | selectedRuleId, matchedRuleIds[], conflictRuleIds[] |
| slaCheckConflicts | serviceId?, rules? | warnings[] |
| slaCalculateForRequest | entityId, reason, expectedVersion? | requestSla |
| calendarsGetList | page/pageSize/search? | PageResult<CalendarSummary> |
| calendarsGet | calendarId | calendar |
| calendarsCalculateDeadline | calendarId, startAt, durationMinutes | deadline |

slaCheckConflicts возвращает эвристическое предупреждение, не доказательство отсутствия пересечений. calendarsCalculateDeadline является проектным контрактом, не известным встроенным API.

TODO(NAUMEN-CALENDAR), TODO(SLA-DEFAULT), TODO(NAUMEN-TXN).

### Пользователи и справочники

| Функция | Запрос | data |
|---|---|---|
| usersGetList | page/pageSize/filters/sort | PageResult<User> |
| usersGet | userId? (без id — текущий) | user |
| usersUpdate | userId, changes, expectedVersion | user |
| usersGetCreatedRequests | userId?, page/pageSize/filters/sort | PageResult<RequestSummary> |
| usersGetAssignedRequests | userId?, page/pageSize/filters/sort | PageResult<RequestSummary> |
| usersGetGroupRequests | userId?, page/pageSize/filters/sort | PageResult<RequestSummary> |
| dictionariesGetGroups | search/page/pageSize | PageResult<EntityRef> |
| dictionariesGetOrganizations | search/page/pageSize | PageResult<EntityRef> |
| dictionariesGetDepartments | search/page/pageSize | PageResult<EntityRef> |
| dictionariesGetItems | dictionaryCode, search/page/pageSize | PageResult<DictionaryItem> |
| dictionariesSearchUsers | search/page/pageSize/organizationIds/departmentIds/activeOnly | PageResult<EntityRef> |

dictionaryCode проверяется по серверному allowlist. usersUpdate принимает только разрешенные поля для роли вызывающего.

TODO(NAUMEN-DIRECTORY), TODO(PROFILE-EDIT).

### Файлы

| Функция | Запрос | data |
|---|---|---|
| filesUpload | entityType, entityId?, file:{name,contentType,size,contentBase64} | attachment или temporaryFile |
| filesGet | attachmentId | metadata и/или проверенная ссылка/контент |
| filesDelete | attachmentId, expectedVersion? | deleted:true |

Это проектные функции. До проверки реального Naumen FileAdapter может существовать только как интерфейс с неподдерживаемой реализацией. Base64 допускается лишь для малого прототипного лимита. Сервер проверяет декодированный размер, сигнатуру, MIME, расширение, безопасное имя, право на entityId и при наличии запускает антивирусную проверку.

TODO(NAUMEN-FILES): endpoint, streaming, хранение, download response, temporary uploads, AV и лимиты.

## 5. Валидация и конкурентность

- Входные Map/List/string/number проверяются явно; неизвестные поля отклоняются или игнорируются по задокументированной политике.
- expectedVersion обязателен для update/delete/publish/reorder.
- Объект читается и изменяется атомарно; несовпадение дает VERSION_CONFLICT.
- requestId обязателен. Для неидемпотентных create/upload сервер хранит результат повторяемого ключа в ограниченном окне.
- Сортировка и условия SLA используют allowlist, а не динамический код/SQL.
- В response не возвращаются внутренние Naumen объекты, stack traces или секреты.

## 6. Каркас Groovy entry function

    Map operation(Map requestContent, def user) {
        String requestId = requestContent?.requestId?.toString()
        try {
            Map currentUser = sessionService.requireUser(requestContent?.sessionToken)
            permissionService.requireAction(currentUser, "resource.action")
            // validate DTO
            // applicationService через проектный adapter
            return successResponse(result, requestId)
        } catch (KnownBusinessException e) {
            return errorResponse(e.code, e.safeMessage, e.fieldErrors, e.details, requestId)
        } catch (Exception e) {
            // безопасный server log только с requestId
            return errorResponse("INTERNAL_ERROR", "Внутренняя ошибка", [:], [], requestId)
        }
    }

sessionService, permissionService и applicationService — проектные компоненты. TODO должен ссылаться на проверяемую точку интеграции Naumen.
