# Архитектура прототипа ITSM

Статус: актуализировано по итогам этапа 16 (файловая интеграция заблокирована до проверки установки).
Источник требований: docs/requirements.md.
Реализованы базовый frontend, транспорт, авторизация, локализация, формы, каталоги, заявки, карточка пользователя и редактор SLA. Файловый механизм не реализован.

## 1. Цели и границы

Прототип — статическое многостраничное приложение без сборки, npm, Node.js и frontend-фреймворков. Используются HTML, CSS, JavaScript ES6 browser modules, Bootstrap, SurveyJS Form Library и SurveyJS Creator.

Frontend работает только с предметными JSON-контрактами. Все особенности Naumen exec-post изолированы в NaumenApiClient. Предметные API-модули зависят от абстракции транспорта; страницы и UI-компоненты не знают ни URL Naumen, ни имен внутренних объектов, ни Groovy API.

Страницы, транспорт, предметные API, проектные Groovy entry-функции и browser unit-тесты реализованы. Привязка проектных адаптеров к реальным объектам и внутренним API Naumen остаётся неподтверждённой.

## 2. Решения и предположения

1. Единственный транспортный endpoint прототипа: POST /services/rest/exec-post. В query string допустимы только accessKey, func и params.
2. Технический accessKey и пользовательский sessionToken независимы. sessionToken передается только в JSON-теле.
3. Для идентификатора заявки во всех предметных контрактах используется entityId. requestId зарезервирован для трассировки.
4. Все даты передаются в ISO 8601 с часовым поясом; длительности SLA — целые минуты.
5. Все изменяемые сущности имеют числовой version. Команды изменения передают expectedVersion.
6. Пагинация единообразна: page начинается с 1, pageSize ограничивается сервером (предлагаемый максимум 100), ответ содержит items, page, pageSize, total, totalPages.
7. Локализуемые значения представлены объектом LocalizedText {ru, en}; сервер может вернуть дополнительно вычисленное displayTitle для запрошенного language.
8. SYSTEM_ADMIN наследует все права. Остальные роли суммируются.
9. У формы допускается не более одного активного DRAFT. Номер версии назначает только сервер.
10. Старые опубликованные версии форм неизменяемы и не удаляются.
11. Сервер — источник истины для прав, доступности услуги, валидации формы и SLA. Проверки frontend служат только UX.
12. Вложения на первом этапе идут отдельной операцией после создания заявки. Связывание временных загрузок до создания заявки требует отдельного решения.
13. Переходы статусов заявки пока разрешены бизнес-требованием, но сервер все равно проверяет роль и доступ к объекту.
14. Настройки языка и темы имеют системное значение по умолчанию и локальное пользовательское переопределение, если оно разрешено.

## 3. Неоднозначности и TODO

- TODO(NAUMEN-AUTH): определить реальный механизм проверки логина/пароля и источник пользователей Naumen.
- TODO(NAUMEN-STORAGE): сопоставить предметные сущности с классами/атрибутами и хранилищем Naumen.
- TODO(NAUMEN-SESSION): определить надежное серверное хранилище сессий, TTL, отзыв и атомарное обновление.
- TODO(NAUMEN-PERMISSIONS): определить источник ролей, групп, организаций и подразделений.
- TODO(NAUMEN-CALENDAR): проверить доступные API календарей, праздников, часовых зон и расчета рабочего срока.
- TODO(NAUMEN-FILES): проверить реальный API загрузки, чтения и удаления вложений, лимиты и антивирусную проверку.
- TODO(NAUMEN-TXN): проверить транзакционность публикации версии, изменения порядка SLA и создания заявки вместе с историей.
- TODO(NAUMEN-HTTP): уточнить управление HTTP-статусами в exec-post; клиент всегда обязан разбирать бизнес-конверт.
- TODO(SURVEY-EXPRESSIONS): утвердить allowlist операторов и функций SurveyJS expressions.
- TODO(SLA-DEFAULT): определить, существует ли SLA по умолчанию и на каком уровне он задается.
- TODO(REQUEST-VISIBILITY): формализовать объектные правила доступа USER и OPERATOR сверх базовой матрицы ролей.
- TODO(PROFILE-EDIT): определить точный список редактируемых и защищенных полей профиля.
- TODO(IDEMPOTENCY): определить срок хранения и область уникальности requestId для команд создания и загрузки.
- TODO(LOCALIZATION): решить, обязательны ли обе локали для всех администрируемых названий.
- TODO(DEPENDENCIES): утвердить версии Bootstrap, SurveyJS и QUnit и способ локального размещения лицензированных файлов.

Имена AuthenticationAdapter, SessionRepository, PermissionAdapter, CatalogRepository, FormRepository, RequestRepository, SlaRepository, CalendarAdapter, DirectoryAdapter, FileAdapter и AuditAdapter ниже — проектные порты, а не заявления о существовании таких API в Naumen.

## 4. Архитектурные слои

Направление зависимостей:

    HTML pages
      -> page controllers
      -> UI components + core use-case modules
      -> subject API modules
      -> TransportClient interface
      -> NaumenApiClient
      -> Naumen exec-post
      -> Groovy entry functions
      -> application services
      -> project adapters
      -> TODO: verified Naumen APIs/storage

Правила:

- fetch разрешен только в js/api/naumen-api-client.js.
- Контроллер страницы координирует use case и состояния loading/empty/error/ready/forbidden.
- Компоненты получают данные и callbacks; сервер не вызывают.
- Core содержит чистую бизнес-логику: permissions, availability, versioning, SLA matching, validation, i18n.
- Предметный API знает имя серверной функции и DTO, но не знает exec-post.
- Groovy entry function валидирует envelope, сессию и право, затем вызывает сервис.
- Сервис реализует предметную операцию через адаптеры; детали Naumen не просачиваются в DTO.
- Все значимые команды пишут аудит с requestId, actorId, entityType, entityId и безопасными метаданными.

## 5. Авторизация и сессии

1. authLogin вызывается с auth:false, логином и паролем в JSON.
2. AuthenticationAdapter проверяет учетные данные через подтвержденный механизм Naumen (TODO).
3. SessionRepository создает криптографически стойкий непрозрачный token, хранит только digest токена, userId, createdAt, expiresAt, lastSeenAt, revokedAt и контекст безопасности.
4. Браузер хранит sessionToken и минимальный снимок пользователя в localStorage согласно требованиям. Пароль не хранится.
5. Каждый защищенный вызов добавляет sessionToken в тело. Сервер проверяет сессию, срок, отзыв, роли и доступ к объекту.
6. authRefresh ротирует token либо продлевает срок по утвержденной политике (TODO); старый токен отзывается при ротации.
7. logout отзывает сессию независимо от локальной очистки.
8. SESSION_EXPIRED, INVALID_SESSION и HTTP 401 приводят к очистке локальной сессии и переходу на login.html.
9. Страница сначала проверяет локальный expiresAt, затем при необходимости вызывает authGetCurrentUser. Доверять локальным ролям для серверного решения запрещено.

## 6. Модели данных

Общие типы:

    EntityRef { id, title }
    LocalizedText { ru, en }
    AuditFields { createdAt, createdBy, updatedAt, updatedBy }
    PageRequest { page, pageSize, filters, sort[] }
    PageResult<T> { items[], page, pageSize, total, totalPages }
    SortItem { field, direction: "asc" | "desc" }

User:

    {
      id, login, title, email, phone,
      organizationIds[], departmentId, groupIds[],
      roles[], language, timezone, active,
      version, ...AuditFields
    }

Session (серверная модель, наружу возвращаются только token и expiresAt):

    {
      id, tokenDigest, userId, createdAt, expiresAt,
      lastSeenAt, revokedAt, version
    }

CatalogFolder:

    {
      id, title: LocalizedText, parentFolderId,
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
      sortOrder, version, ...AuditFields
    }

ServiceAvailability:

    {
      mode: "ALL" | "RESTRICTED",
      userIds[], departmentIds[], organizationIds[]
    }

Service:

    {
      id, code, title: LocalizedText, description: LocalizedText,
      shortDescription: LocalizedText, icon, folderId,
      formId, formVersionId,
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
      sortOrder, responsibleGroupId, defaultAssigneeId,
      slaPolicyId, availability: ServiceAvailability,
      version, ...AuditFields
    }

Form:

    {
      id, code, title: LocalizedText, description: LocalizedText,
      currentPublishedVersionId, activeDraftVersionId,
      version, ...AuditFields
    }

FormVersion:

    {
      id, formId, versionNumber,
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
      schema, sourceVersionId, entityVersion,
      createdAt, createdBy, updatedAt, updatedBy,
      publishedAt, publishedBy
    }

Важно: versionNumber — предметный номер версии; entityVersion — optimistic-lock counter.

Request:

    {
      id, number, title, serviceId, formId, formVersionId,
      fieldValues, authorId, requestedForId,
      status: "NEW" | "REGISTERED" | "IN_PROGRESS" |
              "WAITING_USER" | "RESOLVED" | "CLOSED" | "CANCELLED",
      responsibleGroupId, assigneeId,
      sla: RequestSla, version, ...AuditFields
    }

RequestSla:

    {
      ruleId, matchedRuleIds[], calendarId,
      reactionDeadline, resolutionDeadline,
      reactionAt, resolvedAt,
      paused, pausedAt, accumulatedPauseMinutes,
      reactionBreached, resolutionBreached,
      calculatedAt
    }

Comment:

    {
      id, entityId, type: "PUBLIC" | "INTERNAL",
      text, authorId, createdAt
    }

Attachment:

    {
      id, entityType: "REQUEST", entityId,
      originalName, safeName, contentType, size,
      storageRef, uploadedBy, createdAt
    }

HistoryEvent:

    {
      id, entityType, entityId, eventType,
      actorId, occurredAt, requestId, public,
      changes[], metadata
    }

SlaCondition:

    {
      field, operator:
        "EQ" | "NE" | "IN" | "NOT_IN" |
        "EMPTY" | "NOT_EMPTY" | "RANGE" | "ANY",
      value
    }

SlaRule:

    {
      id, title, serviceId, enabled, order,
      conditions: SlaCondition[],
      reactionTimeMinutes, resolutionTimeMinutes,
      calendarId, pausedStatuses[],
      version, ...AuditFields
    }

SystemSettings:

    {
      defaultLanguage: "ru" | "en",
      defaultTheme: "light" | "dark",
      allowUserThemeOverride,
      sessionTtlMinutes,
      maxUploadBytes,
      allowedUploadExtensions[],
      allowedUploadMimeTypes[],
      version
    }

## 7. Инварианты и алгоритмы

### Доступность услуги

ALL доступна любому авторизованному пользователю. RESTRICTED доступна, если совпал userId, departmentId или пересеклись organizationIds. Сервер повторяет проверку при чтении услуги и создании заявки. Архивная или неопубликованная услуга недоступна пользовательскому каталогу.

Административный контроллер строит дерево из плоских `folders[]`/`services[]` и открывает отдельный редактор выбранного объекта. Селекторы зависят от `FormsApi` и `DictionariesApi`, но не вызывают транспорт напрямую. Изменения папок и услуг передают `expectedVersion`; перемещение, availability и смена статуса являются отдельными серверными командами.

`CatalogRepository` и `DirectoryAdapter` — проектные порты. Первый обязан атомарно проверять пустоту папки, связи услуги и optimistic lock. Второй предоставляет безопасные `EntityRef` для селекторов. Их реализация на внутренних объектах Naumen остаётся TODO(NAUMEN-CATALOG/NAUMEN-DIRECTORY).

Пользовательский каталог вызывает только `catalogGetAvailableTree`. Сервер строит доверенный контекст пользователя по сессии и возвращает уже отфильтрованные `PUBLISHED` услуги вместе с папками-предками. Поиск не выполняется над административным кэшем браузера. Клиентский availability matcher допускается лишь для тестов и дополнительного сужения полученного результата; он не может восстановить скрытую сервером услугу. Режим cards/list — локальная UX-настройка и хранится отдельно от сессии.

### Версионирование формы

- Создание формы атомарно создает стабильную Form и DRAFT v1.
- Редактировать можно только активный DRAFT.
- Попытка редактировать PUBLISHED/ARCHIVED создает DRAFT из sourceVersionId.
- Сервер под блокировкой/транзакцией назначает versionNumber и гарантирует один активный DRAFT.
- Публикация проверяет schema, expectedVersion и связь с Form, переводит DRAFT в PUBLISHED, обновляет currentPublishedVersionId и очищает activeDraftVersionId.
- Ранее опубликованная версия сохраняется неизменной; существующие Request продолжают ссылаться на нее.

Реализация этапа 7 разделена на четыре границы:

    form-editor-page -> form-versioning -> FormsApi -> NaumenApiClient
                                            |
                                            v
    FormFunctions -> FormRepository + FormSchemaValidator (project adapters)

`form-versioning.js` решает только клиентские вопросы: выбор активной версии, доступность редактирования и построение команд с optimistic lock. Он намеренно не вычисляет `versionNumber`. Контроллер хранит признак несохранённых изменений и устанавливает `beforeunload`; сохранение и публикация очищают его только после успешного ответа.

`FormRepository` обязан одной атомарной операцией проверить `Form.version`/`FormVersion.entityVersion`, принадлежность версии форме, статус активного DRAFT, отсутствие второго черновика, назначить следующий номер и обновить ссылки формы. `FormSchemaValidator` задаёт серверный allowlist элементов, свойств, expressions и URL. Это проектные интерфейсы; их привязка к реальным объектам и транзакциям Naumen остаётся TODO.

SurveyJS Creator подключён на одной admin-странице как браузерная библиотека. Он редактирует JSON только для активного DRAFT. PUBLISHED/ARCHIVED и неактивный DRAFT открываются read-only; из старой версии разрешена лишь отдельная команда клонирования в новый DRAFT.

### Создание заявки по услуге

Страница сначала получает серверно отфильтрованную услугу, затем запрашивает конкретную опубликованную FormVersion с контекстом `serviceId`. До передачи схемы в SurveyJS выполняется клиентская структурная allowlist-проверка. Поддерживаются декларативные `visibleIf`, `requiredIf` и простые арифметические `expression`; вызовы функций, event-свойства, HTML, `choicesByUrl` и внешние URL отклоняются.

Динамические choices заполняет `SurveyDictionaryLoader` только через `DictionariesApi` и фиксированные проектные `REQUEST_*` коды. После клиентской проверки `requestsCreate` заново загружает услугу и версию и передаёт values проектному `SubmissionValidator`. `RequestRepository` отвечает за idempotency `requestId` и сохранение ссылки на неизменяемую FormVersion. Файловый UI остаётся отключённым до реализации `FileAdapter`.

### Список заявок

Вертикаль этапа 11 имеет границы `requests-page -> RequestsApi -> NaumenApiClient ->
requestsGetList -> RequestRepository`. Контроллер отправляет только номер текущей страницы,
размер, нормализованные фильтры и allowlist-сортировку. Сервер заново получает роли и формирует
неподменяемый visibility context: USER, OPERATOR либо SYSTEM_ADMIN. Проектный
`RequestRepository.findVisiblePage` должен выполнить ACL, поиск, фильтрацию, сортировку и
пагинацию одним серверным запросом; внутренние API и модель хранения Naumen остаются TODO.

### Карточка заявки

Вертикаль этапа 12 разделена на `request-card-page`, изолированные компоненты комментариев,
истории, назначения и SLA, предметные `RequestsApi`/`FormsApi` и серверные entry-функции.
Историческая FormVersion загружается по `formVersionId` только в контексте доступной заявки и
рендерится SurveyJS в режиме `display`; `fieldValues` не имеют команды изменения. Команды
статуса, назначения и комментария передают `expectedVersion`, а repository обязан атомарно
вернуть `VERSION_CONFLICT`. Видимость внутренних комментариев/событий и право обработки
проверяются сервером. Все repository/directory/calendar/file вызовы остаются проектными портами.

### Карточка пользователя

`profile-page -> UsersApi/RequestsApi -> NaumenApiClient -> UserFunctions` разделяет профиль и три
независимых серверно-пагинируемых списка. Пустой `userId` означает текущего пользователя; чужой
профиль и его списки доступны только SYSTEM_ADMIN. Self-update имеет фиксированный allowlist
`language/timezone`, административный allowlist отдельно включает основные данные и членство.
Сервер отклоняет неизвестные или защищённые поля и атомарно проверяет `expectedVersion`.
`UserRepository`, `RequestRepository`, `PermissionAdapter` и `DirectoryAdapter` остаются проектными
портами до подтверждения реальных объектов и ACL Naumen.

### SLA

matchSlaRules фильтрует enabled, стабильно сортирует по order, вычисляет совпадения по allowlist операторов ANY, EQ, NE, IN, NOT_IN, EMPTY, NOT_EMPTY и RANGE, выбирает первое и возвращает matchedRuleIds и conflictRuleIds. findPotentialSlaConflicts выполняет лишь консервативную UX-проверку и всегда маркирует предупреждения approximate. Серверная slaTestRules независимо повторяет сопоставление и остаётся источником истины. Отсутствие правила возвращает SLA_NOT_FOUND либо утвержденное правило по умолчанию (TODO). Только сервер вызывает CalendarAdapter для рабочих дедлайнов, праздников и часовых поясов. Создание заявки и смена статуса атомарно добавляют событие пересчета; несколько совпадений дополнительно создают SLA_RULE_CONFLICT. Пауза и возобновление используют серверное время и календарь.

## 8. Итоговое дерево проекта

    /
    ├── login.html
    ├── service-catalog.html
    ├── service-form.html
    ├── requests.html
    ├── request-card.html
    ├── profile.html
    ├── admin/
    │   ├── catalog-editor.html
    │   ├── forms.html
    │   ├── form-editor.html
    │   └── sla-editor.html
    ├── css/
    │   ├── app.css
    │   ├── themes.css
    │   ├── components.css
    │   └── pages/{login,catalog,forms,requests,profile,sla}.css
    ├── js/
    │   ├── config.js
    │   ├── app.js
    │   ├── api/
    │   │   ├── transport-client.js
    │   │   ├── naumen-api-client.js
    │   │   ├── auth-api.js
    │   │   ├── catalog-api.js
    │   │   ├── forms-api.js
    │   │   ├── requests-api.js
    │   │   ├── sla-api.js
    │   │   ├── users-api.js
    │   │   ├── files-api.js
    │   │   └── dictionaries-api.js
    │   ├── core/
    │   │   ├── auth-session.js
    │   │   ├── permissions.js
    │   │   ├── i18n.js
    │   │   ├── theme.js
    │   │   ├── validation.js
    │   │   ├── formatters.js
    │   │   ├── query-params.js
    │   │   ├── request-id.js
    │   │   ├── sla-matcher.js
    │   │   ├── availability-matcher.js
    │   │   ├── form-versioning.js
    │   │   ├── safe-survey-schema.js
    │   │   └── event-bus.js
    │   ├── i18n/{ru,en}.js
    │   ├── components/
    │   │   ├── app-layout.js
    │   │   ├── navbar.js
    │   │   ├── sidebar.js
    │   │   ├── modal.js
    │   │   ├── confirm-modal.js
    │   │   ├── notifications.js
    │   │   ├── data-table.js
    │   │   ├── pagination.js
    │   │   ├── loading-indicator.js
    │   │   ├── error-panel.js
    │   │   ├── empty-state.js
    │   │   ├── forbidden-state.js
    │   │   ├── entity-selectors.js
    │   │   ├── file-uploader.js
    │   │   └── sla-indicator.js
    │   └── pages/
    │       ├── login-page.js
    │       ├── catalog-editor-page.js
    │       ├── service-catalog-page.js
    │       ├── service-form-page.js
    │       ├── forms-page.js
    │       ├── form-editor-page.js
    │       ├── requests-page.js
    │       ├── request-card-page.js
    │       ├── sla-editor-page.js
    │       └── profile-page.js
    ├── vendor/{bootstrap,surveyjs,qunit}/
    ├── groovy/
    │   ├── entry/{Auth,Catalog,Form,Request,Sla,User,Dictionary,File}Functions.groovy
    │   ├── services/{Authentication,Session,Permission,Catalog,Form,Request,Sla,User,File,Audit}Service.groovy
    │   └── adapters/README.md
    ├── tests/
    │   ├── test-runner.html
    │   └── *.test.js
    ├── docs/
    │   ├── requirements.md
    │   ├── architecture.md
    │   ├── rest-api.md
    │   ├── permissions.md
    │   ├── security.md
    │   ├── running.md
    │   ├── naumen-integration.md
    │   └── naumen-files.md
    └── README.md

Фигурные обозначения в дереве — сокращение документа, а не буквальные имена каталогов/файлов.

## 9. Серверные функции

Полный контракт приведен в docs/rest-api.md. Группы:

- auth: authLogin, authLogout, authRefresh, authGetCurrentUser.
- catalog: catalogGetTree, catalogGetAvailableTree, catalogGetFolder, catalogCreateFolder, catalogUpdateFolder, catalogDeleteFolder, catalogGetServices, catalogGetService, catalogCreateService, catalogUpdateService, catalogMoveService, catalogChangeServiceStatus, catalogGetServiceAvailability, catalogUpdateServiceAvailability.
- forms: formsGetList, formsGet, formsCreate, formsUpdate, formsGetVersions, formsGetVersion, formsCreateVersion, formsCloneVersion, formsSaveDraft, formsPublishVersion.
- requests: requestsGetList, requestsCreate, requestsGet, requestsChangeStatus, requestsChangeAssignment, requestsAddComment, requestsGetComments, requestsGetHistory, requestsGetAttachments, requestsAddAttachment, requestsGetSla, requestsRecalculateSla.
- SLA/calendar: slaGetRules, slaGetRule, slaCreateRule, slaUpdateRule, slaDeleteRule, slaReorderRules, slaTestRules, slaCheckConflicts, slaCalculateForRequest, calendarsGetList, calendarsGet, calendarsCalculateDeadline.
- users/directories: usersGetList, usersGet, usersUpdate, usersGetCreatedRequests, usersGetAssignedRequests, usersGetGroupRequests, dictionariesGetGroups, dictionariesGetOrganizations, dictionariesGetDepartments, dictionariesGetItems, dictionariesSearchUsers.
- files: зарезервированы filesUpload, filesGet, filesDelete. Сейчас entry-функции fail closed с `FILES_INTEGRATION_UNAVAILABLE`; это не рабочий API. `FileAdapter` остаётся проектным портом до подтверждения текущей установки — см. `docs/naumen-files.md` и TODO(NAUMEN-FILES).

## 10. План вертикальной реализации

Каждая часть включает код, browser unit tests, проверку diff, документацию и перечень TODO.

1. Каркас и зависимости: каталоги, конфигурация-заглушка, статический запуск, лицензии vendor.
2. Транспорт: TransportClient, NaumenApiClient, envelope/errors/timeout/abort/requestId, тесты единственного fetch.
3. Сессия и вход: auth API, SessionStore, login/logout/refresh/expiry и защищенный bootstrap.
4. Авторизация UI: permission map, route guards, forbidden state; серверные session/permission adapters.
5. Общий shell: layout, состояния страницы, модальные окна, toast, навигация.
6. I18n и темы: ru/en, раннее применение темы, системные defaults.
7. Формы — список: серверная пагинация/сортировка, права и состояния.
8. Формы — редактор: безопасная SurveyJS schema, draft/clone/publish, optimistic locking.
9. Каталог администратора: дерево, CRUD папок/услуг, перемещение, публикация, availability.
10. Каталог пользователя: серверно отфильтрованное дерево, поиск и представления.
11. Создание заявки: доступная услуга, конкретная версия формы, server validation, idempotency, переход к карточке.
12. Список заявок: объектные права, серверные фильтры, сортировка и пагинация.
13. Карточка заявки: read-only snapshot, статус/назначение, комментарии, история, locking.
14. Профили: текущий/чужой пользователь и три списка заявок.
15. SLA: редактор, чистый matcher, предупреждение пересечений, server-authoritative расчет.
16. Вложения: только после проверки Naumen API; лимиты, сигнатуры, безопасные имена и хранение.
17. Сквозное укрепление: security tests, accessibility/responsiveness, error handling, docs/running и naumen-integration.

## 11. Архитектурные проверки перед реализацией

- Вне naumen-api-client.js отсутствует fetch.
- UI и core не содержат modules.newItsmTest и детали exec-post.
- Все команды с изменением состояния имеют expectedVersion или idempotency requestId.
- Все защищенные функции проверяют сессию, действие и объект.
- Неизвестные интеграции реализуются через интерфейс адаптера с TODO.
- Никаких реальных URL, accessKey, токенов и паролей в репозитории.
