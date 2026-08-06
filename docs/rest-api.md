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

`catalogGetAvailableTree` принимает `{search}` и требует только активную пользовательскую сессию. Сервер получает `userId` из сессии, а подразделение и все организации — через проектный `DirectoryAdapter`; значения из браузера для решения доступности не принимаются. `CatalogRepository.findAvailableTree` возвращает только `PUBLISHED` услуги, удовлетворяющие `ALL` либо хотя бы одному условию `RESTRICTED`, и необходимые для дерева папки-предки. Поиск выполняется в том же серверном scope и не расширяет доступ.

Ответ:

    {
      "folders": [{"id":"folder$1","title":{"ru":"...","en":"..."},"parentFolderId":null,"sortOrder":0}],
      "services": [{"id":"service$1","title":{"ru":"...","en":"..."},"shortDescription":{"ru":"...","en":"..."},"icon":"support","folderId":"folder$1","formId":"form$1","formVersionId":"formVersion$2","status":"PUBLISHED","sortOrder":0}]
    }

В ответ пользовательского каталога не включаются внутренние назначения, SLA-настройки или списки audience, если они не нужны интерфейсу. Конкретное построение server-side scope в Naumen остаётся `TODO(NAUMEN-CATALOG)` и `TODO(NAUMEN-DIRECTORY)`.

Сервер проверяет отсутствие потомков перед удалением папки; уникальность code; существование папки; совместимость formId/formVersionId; опубликованность выбранной версии при публикации услуги; принадлежность assignee группе; доступность при чтении и создании заявки.

Пример availability:

    {
      "mode": "RESTRICTED",
      "userIds": ["employee$1"],
      "departmentIds": ["department$1"],
      "organizationIds": ["organization$1"]
    }

TODO(NAUMEN-STORAGE), TODO(NAUMEN-DIRECTORY).

Контракты административного редактора этапа 8:

    catalogGetTree {"includeArchived":true,"includeDrafts":true}
      -> {"folders":[],"services":[]}

    catalogCreateFolder {"folder":{"title":{"ru":"...","en":"..."},"parentFolderId":null,"sortOrder":0}}
    catalogUpdateFolder {"folderId":"folder$1","changes":{...},"expectedVersion":3}
    catalogDeleteFolder {"folderId":"folder$1","expectedVersion":3}

    catalogCreateService {"service":{"code":"...","folderId":"folder$1","formId":"form$1",
      "formVersionId":"formVersion$2","responsibleGroupId":"group$1","defaultAssigneeId":"user$1",
      "slaPolicyId":"sla$1","status":"DRAFT","sortOrder":10,
      "availability":{"mode":"RESTRICTED","userIds":[],"departmentIds":[],"organizationIds":[]}}}

    catalogUpdateService {"serviceId":"service$1","changes":{...},"expectedVersion":4}
    catalogMoveService {"serviceId":"service$1","targetFolderId":"folder$2","expectedVersion":5}
    catalogChangeServiceStatus {"serviceId":"service$1","status":"PUBLISHED","expectedVersion":6}
    catalogUpdateServiceAvailability {"serviceId":"service$1","availability":{...},"expectedVersion":7}

`catalogRepository` выполняет все проверки изменения атомарно. Удаление непустой папки возвращает `DEPENDENCY_EXISTS`; несовпадение версии — `VERSION_CONFLICT`. При публикации адаптер повторно проверяет существование папки, опубликованный `formVersionId`, принадлежность версии `formId`, группу, ответственного и SLA-политику. Перемещение не меняет порядок автоматически: `sortOrder` остаётся явным полем услуги.

`availability.mode=ALL` канонически хранится с пустыми массивами. Для `RESTRICTED` сервер валидирует существование всех ссылок. Проверка на frontend предназначена только для UX; сервер остаётся источником истины.

Селекторы этапа 8 используют `dictionariesGetGroups`, `dictionariesGetOrganizations`, `dictionariesGetDepartments`, `dictionariesSearchUsers` и `dictionariesGetItems`. Для SLA-политик введён проектный `dictionaryCode=SLA_POLICIES`; это не известный справочник Naumen. Его сопоставление выполняет `DirectoryAdapter` и остаётся `TODO(NAUMEN-DIRECTORY)`. Все списки возвращают общий `PageResult<EntityRef>` и ограничиваются 100 элементами на запрос.

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

Для обычного пользователя `formsGetVersion` требует одновременно `formVersionId` и `serviceId`. Проектный адаптер возвращает JSON только если услуга доступна пользователю, имеет статус `PUBLISHED`, ссылается именно на эту версию и версия также `PUBLISHED`. Передача одного `formVersionId` обычным пользователем не разрешает чтение версии. Административный контракт для `FORM_ADMIN` сохраняется.

formsCreateVersion/Clone назначают versionNumber на сервере. Save разрешен только активному DRAFT. Publish валидирует безопасную schema и выполняется атомарно. VERSION_CONFLICT возвращается и при конкурирующем создании второго DRAFT.

На этапе 7 реализованы браузерные контракты и Groovy entry-функции всех перечисленных операций редактора. `formRepository` и `formSchemaValidator` — проектные порты; конкретное хранение, блокировки и SurveyJS allowlist в Naumen остаются TODO(NAUMEN-FORMS), TODO(NAUMEN-TXN) и TODO(SURVEY-EXPRESSIONS).

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

Команды этапа 7:

    formsCreate {
      "form": {"code":"INCIDENT","title":{"ru":"Инцидент","en":"Incident"},"description":{"ru":"","en":""}},
      "initialSchema": {"pages":[]}
    }

    formsCreateVersion {
      "formId":"form$1","sourceVersionId":"formVersion$1","schema":null,"expectedFormVersion":3
    }

    formsCloneVersion {
      "formId":"form$1","sourceVersionId":"formVersion$1","expectedFormVersion":3
    }

    formsSaveDraft {
      "formId":"form$1","formVersionId":"formVersion$2","schema":{"pages":[]},"expectedVersion":4
    }

    formsPublishVersion {
      "formId":"form$1","formVersionId":"formVersion$2","expectedVersion":5
    }

`expectedFormVersion` относится к optimistic-lock полю `Form.version`; `expectedVersion` — к `FormVersion.entityVersion`. Клиент никогда не передаёт желаемый `versionNumber`: его назначает `formRepository` в атомарной операции. `formsCreate` возвращает `{form,draftVersion}`, `formsCreateVersion`/`formsCloneVersion`/`formsSaveDraft` — `draftVersion`, публикация — `{form,publishedVersion}`.

Адаптер мутаций возвращает проектный результат `{data:...}` либо `{errorCode,safeMessage,fieldErrors,details}`. Конкурентное создание второго черновика, несовпадение optimistic lock, попытка сохранить неактивный DRAFT или публикация уже изменённой версии возвращают `VERSION_CONFLICT`. PUBLISHED и ARCHIVED не имеют операций update/delete.

Перед сохранением и повторно внутри транзакции публикации `formSchemaValidator` проверяет JSON по утверждённому allowlist. До реализации адаптера команды изменения завершаются безопасной ошибкой, а не сохраняют непроверенную схему.

### Заявки

| Функция | Запрос | data |
|---|---|---|
| requestsGetList | page/pageSize/filters/sort | PageResult<RequestSummary> |
| requestsCreate | serviceId, formId, formVersionId, fieldValues, attachmentIds? | request |
| requestsGet | entityId | request, service |
| requestsChangeStatus | entityId, newStatus, comment?, expectedVersion | request |
| requestsChangeAssignment | entityId, responsibleGroupId, assigneeId?, expectedVersion | request |
| requestsAddComment | entityId, comment:{type,text}, expectedVersion | comment, request |
| requestsGetComments | entityId, page/pageSize | PageResult<Comment> |
| requestsGetHistory | entityId, page/pageSize | PageResult<HistoryEvent> |
| requestsGetAttachments | entityId | attachments[] |
| requestsAddAttachment | entityId, file/temporaryFileId, expectedVersion? | attachment |
| requestsGetSla | entityId | requestSla |
| requestsRecalculateSla | entityId, reason, expectedVersion | requestSla |

requestsCreate использует requestId как idempotency key. Сервер заново проверяет услугу, доступность, конкретную опубликованную версию, allowlist полей, обязательность, типы, requestedFor и вложения. fieldValues не превращаются в произвольные имена атрибутов без schema mapping в RequestRepository.

Контракт этапа 10:

    requestsCreate {
      "serviceId":"service$1",
      "formId":"form$1",
      "formVersionId":"formVersion$2",
      "fieldValues":{"subject":"...","requestedFor":"user$1"},
      "attachmentIds":[]
    }

Успех возвращает Request summary как минимум с `id` (допускается совместимый `entityId`). `authorId`, назначения и SLA нельзя передавать с клиента: сервер получает автора из сессии, заново загружает доступную опубликованную услугу и её неизменяемую форму. `SubmissionValidator` проверяет schema allowlist, обязательность, типы, visible/required expressions, вычисляемые поля, dictionaryCode и допустимость каждого справочного ID. `RequestRepository.createIdempotent` атомарно использует транспортный `requestId`; повтор того же ключа возвращает исходный результат.

На этапе 10 `attachmentIds` обязан быть пустым. Непустой список возвращает `VALIDATION_ERROR`, пока `TODO(NAUMEN-FILES)` не закрыт.

Контракт списка этапа 11:

    requestsGetList {
      "page":1,
      "pageSize":20,
      "filters":{
        "search":"printer", "number":"REQ-", "title":"...",
        "statuses":["IN_PROGRESS"], "service":"...", "author":"...",
        "requestedFor":"...", "responsibleGroup":"...", "assignee":"...",
        "createdFrom":"2026-08-01T00:00:00.000Z", "createdTo":null,
        "slaBreached":true,
        "reactionDeadlineFrom":null, "reactionDeadlineTo":null,
        "resolutionDeadlineFrom":null, "resolutionDeadlineTo":null
      },
      "sort":[{"field":"createdAt","direction":"desc"}]
    }

Допустимые поля сортировки: `number`, `title`, `serviceTitle`, `authorTitle`, `status`,
`responsibleGroupTitle`, `assigneeTitle`, `reactionDeadline`, `resolutionDeadline`, `createdAt`.
`pageSize` ограничен 100. Ответ содержит `items`, `page`, `pageSize`, `total`, `totalPages`;
`RequestSummary` содержит как минимум `id`, `number`, `title`, `serviceTitle`, `authorTitle`,
`status`, `responsibleGroupTitle`, `assigneeTitle`, `createdAt` и объект `sla` с дедлайнами и
признаками паузы/нарушения.

Клиент не передаёт scope. `requestsGetList` строит его только из доверенной сессии и ролей:
USER получает доступные ему объекты, OPERATOR — назначенные лично, через группу или серверную
политику, SYSTEM_ADMIN — все. `RequestRepository.findVisiblePage` обязан применять ACL, фильтры,
сортировку, `COUNT` и `LIMIT/OFFSET` на сервере; загрузка полного набора для последующей пагинации запрещена.

`DirectoryAdapter.getRequestAccessContext` и `RequestRepository.findVisiblePage` — проектные
адаптеры, а не встроенные API Naumen. Их привязка остаётся TODO(REQUEST-VISIBILITY) и
TODO(NAUMEN-STORAGE); создание также сохраняет TODO(IDEMPOTENCY).

Контракт карточки этапа 12:

    requestsGet { "entityId":"request$1" }
    formsGetVersion { "formVersionId":"formVersion$2", "requestEntityId":"request$1" }
    requestsChangeStatus {
      "entityId":"request$1", "newStatus":"IN_PROGRESS",
      "comment":"Принята в работу", "expectedVersion":8
    }
    requestsChangeAssignment {
      "entityId":"request$1", "responsibleGroupId":"group$2",
      "assigneeId":"user$3", "expectedVersion":9
    }
    requestsAddComment {
      "entityId":"request$1", "comment":{"type":"PUBLIC","text":"..."},
      "expectedVersion":10
    }

`requestsGetComments` и `requestsGetHistory` принимают `entityId`, `page`, `pageSize` и возвращают
`PageResult`. `requestsGetAttachments` возвращает только безопасные метаданные вложений;
загрузка/скачивание не заявлены до реализации `TODO(NAUMEN-FILES)`. `requestsGetSla` возвращает
серверный snapshot с дедлайнами, признаками нарушения/паузы и оставшимся рабочим временем в минутах.

USER читает только доступную заявку и публичные комментарии. OPERATOR/SYSTEM_ADMIN при наличии
права обработки видят внутренние комментарии и внутренние события, меняют статус/назначение и
добавляют INTERNAL. PUBLIC требует права чтения. Все изменения атомарно сравнивают
`expectedVersion`; несовпадение возвращает `VERSION_CONFLICT`. Поля `fieldValues` не имеют
операции изменения и отображаются через неизменяемую FormVersion в режиме read-only.

`RequestRepository.findVisibleDetails`, `findReadableFormVersion`, `canProcess`, атомарные
мутации, страницы комментариев/истории и SLA snapshot — проектные адаптеры, не встроенные API
Naumen. Их сопоставление с ACL, объектами, историей и календарями остаётся
`TODO(REQUEST-VISIBILITY)`, `TODO(NAUMEN-STORAGE)` и `TODO(NAUMEN-CALENDAR)`.

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

slaGetRules дополнительно возвращает `rulesVersion`, используемый как `expectedVersion` единой операции reorder. В update поле `enabled` включает или отключает правило; отдельного REST-метода для переключения нет. Все условия проверяются по allowlist полей и операторов. `slaTestRules` всегда выполняет серверное сопоставление и возвращает первое и все совпадения.

slaCheckConflicts возвращает элементы `{ruleIds, approximate:true}`: это эвристическое предупреждение, а не доказательство отсутствия пересечений. calendarsCalculateDeadline и остальные обращения к календарям являются проектными контрактами `CalendarAdapter`, а не известными встроенными API Naumen. Клиентский matcher не рассчитывает рабочее время.

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

Для SurveyJS разрешены только проектные коды `REQUEST_USERS`, `REQUEST_GROUPS`, `REQUEST_DEPARTMENTS`, `REQUEST_ORGANIZATIONS`. Они вызываются через `dictionariesGetItems`; `DirectoryAdapter.findRequestDictionaryItems` обязан применять пользовательский scope и возвращать только `{id,title}`. `choicesByUrl` и произвольные URL схемы запрещены. `SLA_POLICIES` остаётся административным кодом и требует `CATALOG_ADMIN`/`SYSTEM_ADMIN`.

dictionaryCode проверяется по серверному allowlist. usersUpdate принимает только разрешенные поля для роли вызывающего.

Контракт профиля этапа 13:

    usersGet {}                                      // текущий пользователь
    usersGet { "userId":"user$2" }                 // только SYSTEM_ADMIN для чужого
    usersUpdate {
      "userId":"user$2",
      "changes":{
        "title":"...", "email":"...", "phone":"...", "active":true,
        "organizationIds":["org$1"], "departmentId":"department$1",
        "groupIds":["group$1"], "roles":["USER","OPERATOR"],
        "language":"ru", "timezone":"Europe/Moscow"
      },
      "expectedVersion":7
    }

Обычный пользователь может вызвать `usersUpdate` для себя только с `language` и `timezone`.
Передача защищённых полей без SYSTEM_ADMIN возвращает `FORBIDDEN`; поля не игнорируются молча.
Даже SYSTEM_ADMIN не меняет через этот контракт `id` или `login`. Изменения используют optimistic
lock и возвращают `VERSION_CONFLICT` при несовпадении версии.

`usersGetCreatedRequests`, `usersGetAssignedRequests` и `usersGetGroupRequests` принимают
`userId`, `page`, `pageSize`, `filters`, `sort`. Чужой `userId` доступен только SYSTEM_ADMIN.
ASSIGNED означает персонального ответственного независимо от группы; GROUP — заявки доверенно
вычисленных групп пользователя независимо от assignee. ACL, фильтрация, сортировка, `COUNT` и
`LIMIT/OFFSET` выполняются серверным repository до возврата DTO.

`UserRepository.findProfile/updateProfileAtomic` и `RequestRepository.findUserRequestPage` —
проектные адаптеры, не встроенные API Naumen. Маппинг пользователей и членства остаётся
`TODO(NAUMEN-USERS)`, `TODO(NAUMEN-PERMISSIONS)` и `TODO(PROFILE-EDIT)`.

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
