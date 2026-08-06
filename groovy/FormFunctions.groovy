/**
 * Entry-функции форм и версий для modules.newItsmTest.forms*.
 *
 * formRepository, sessionRepository, permissionAdapter, catalogRepository,
 * requestRepository и directoryAdapter — проектные порты,
 * а не встроенные API Naumen.
 * formRepository обязан атомарно проверять expectedVersion, назначать
 * versionNumber и гарантировать единственный активный DRAFT.
 * formSchemaValidator — проектный allowlist-валидатор SurveyJS JSON.
 * TODO(NAUMEN-FORMS): сопоставить Form/FormVersion с реальными объектами Naumen.
 * TODO(NAUMEN-TXN): подтвердить транзакции/блокировки для команд версий.
 * TODO(SURVEY-EXPRESSIONS): утвердить допустимые SurveyJS expressions и URL.
 * TODO(NAUMEN-SESSION): подключить подтверждённое серверное хранилище сессий.
 * TODO(NAUMEN-PERMISSIONS): подключить подтверждённый источник ролей.
 */
class FormFunctions {
    static final Set ALLOWED_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as Set
    static final Set ALLOWED_SORT_FIELDS = ['code', 'title', 'status', 'updatedAt'] as Set

    def formRepository
    def sessionRepository
    def permissionAdapter
    def formSchemaValidator
    def catalogRepository
    def requestRepository
    def directoryAdapter
    def logger

    Map formsGetList(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map access = requireFormAdmin(requestContent, requestId)
            if (access.errorResponse) return access.errorResponse

            int page = normalizePage(requestContent?.page)
            int pageSize = normalizePageSize(requestContent?.pageSize)
            Map filters = normalizeFilters(requestContent?.filters)
            List sort = normalizeSort(requestContent?.sort)
            String language = normalizeLanguage(requestContent?.language)

            // Проектный repository должен выполнить фильтрацию, сортировку и
            // пагинацию на сервере, не загружая полный набор в Groovy-функцию.
            Map result = formRepository.findPage(
                access.currentUser, filters, sort, page, pageSize, language
            )
            return CommonFunctions.successResponse(normalizePageResult(result, page, pageSize), requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse(
                'VALIDATION_ERROR', exception.message, [:], [], requestId
            )
        } catch (Exception exception) {
            safeLog('formsGetList', requestId, exception)
            return internalError(requestId)
        }
    }

    Map formsGet(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map access = requireFormAdmin(requestContent, requestId)
            if (access.errorResponse) return access.errorResponse
            String formId = requiredId(requestContent?.formId)
            Map form = formRepository.findById(formId, access.currentUser)
            if (!form) return notFound(requestId)
            return CommonFunctions.successResponse(form, requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse('VALIDATION_ERROR', exception.message, [:], [], requestId)
        } catch (Exception exception) {
            safeLog('formsGet', requestId, exception)
            return internalError(requestId)
        }
    }

    Map formsGetVersions(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map access = requireFormAdmin(requestContent, requestId)
            if (access.errorResponse) return access.errorResponse
            String formId = requiredId(requestContent?.formId)
            int page = normalizePage(requestContent?.page)
            int pageSize = normalizePageSize(requestContent?.pageSize)
            Map result = formRepository.findVersionsPage(
                formId, access.currentUser, page, pageSize
            )
            return CommonFunctions.successResponse(normalizePageResult(result, page, pageSize), requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse('VALIDATION_ERROR', exception.message, [:], [], requestId)
        } catch (Exception exception) {
            safeLog('formsGetVersions', requestId, exception)
            return internalError(requestId)
        }
    }

    Map formsGetVersion(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map access = requireAuthenticated(requestContent, requestId)
            if (access.errorResponse) return access.errorResponse
            String versionId = requiredId(requestContent?.formVersionId, 'formVersionId')
            Map version
            if (access.currentUser.roles.any { ['FORM_ADMIN', 'SYSTEM_ADMIN'].contains(it) }) {
                version = formRepository.findVersionById(versionId, access.currentUser)
            } else if (requestContent?.requestEntityId) {
                String requestEntityId = requiredId(requestContent.requestEntityId, 'requestEntityId')
                // Project adapter verifies object-level request read access and
                // that this immutable version is the one stored on the request.
                version = requestRepository.findReadableFormVersion(
                    requestEntityId, versionId, access.currentUser, formRepository
                )
            } else {
                String serviceId = requiredId(requestContent?.serviceId, 'serviceId')
                Map userContext = directoryAdapter.getCatalogAccessContext(access.currentUser.id)
                if (!(userContext instanceof Map)) throw new IllegalStateException('DirectoryAdapter returned invalid context')
                userContext.id = access.currentUser.id
                // Project adapter returns a version only when the service is
                // available, PUBLISHED and references this PUBLISHED version.
                version = catalogRepository.findPublishedFormVersionForService(
                    serviceId, versionId, userContext, formRepository
                )
            }
            return version ? CommonFunctions.successResponse(version, requestId) : versionNotFound(requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse('VALIDATION_ERROR', exception.message, [:], [], requestId)
        } catch (Exception exception) {
            safeLog('formsGetVersion', requestId, exception)
            return internalError(requestId)
        }
    }

    Map formsCreate(Map requestContent, def user) {
        return writeOperation('formsCreate', requestContent) { access, requestId ->
            Map formInput = normalizeFormInput(requestContent?.form)
            Map schema = requireSafeSchema(requestContent?.initialSchema)
            // Project adapter contract: one atomic call creates Form + DRAFT v1;
            // versionNumber is never accepted from the client.
            Map result = formRepository.createFormWithDraft(formInput, schema, access.currentUser, requestId)
            return mutationResponse(result, requestId)
        }
    }

    Map formsCreateVersion(Map requestContent, def user) {
        return writeOperation('formsCreateVersion', requestContent) { access, requestId ->
            String formId = requiredId(requestContent?.formId)
            String sourceVersionId = optionalId(requestContent?.sourceVersionId)
            long expected = requiredVersion(requestContent?.expectedFormVersion, 'expectedFormVersion')
            Map schema = requestContent?.schema == null ? null : requireSafeSchema(requestContent.schema)
            Map result = formRepository.createDraftAtomically(
                formId, sourceVersionId, schema, expected, access.currentUser, requestId
            )
            return mutationResponse(result, requestId)
        }
    }

    Map formsCloneVersion(Map requestContent, def user) {
        return writeOperation('formsCloneVersion', requestContent) { access, requestId ->
            String formId = requiredId(requestContent?.formId)
            String sourceVersionId = requiredId(requestContent?.sourceVersionId, 'sourceVersionId')
            long expected = requiredVersion(requestContent?.expectedFormVersion, 'expectedFormVersion')
            Map result = formRepository.cloneDraftAtomically(
                formId, sourceVersionId, expected, access.currentUser, requestId
            )
            return mutationResponse(result, requestId)
        }
    }

    Map formsSaveDraft(Map requestContent, def user) {
        return writeOperation('formsSaveDraft', requestContent) { access, requestId ->
            String formId = requiredId(requestContent?.formId)
            String versionId = requiredId(requestContent?.formVersionId, 'formVersionId')
            long expected = requiredVersion(requestContent?.expectedVersion, 'expectedVersion')
            Map schema = requireSafeSchema(requestContent?.schema)
            Map result = formRepository.saveActiveDraftAtomically(
                formId, versionId, schema, expected, access.currentUser, requestId
            )
            return mutationResponse(result, requestId)
        }
    }

    Map formsPublishVersion(Map requestContent, def user) {
        return writeOperation('formsPublishVersion', requestContent) { access, requestId ->
            String formId = requiredId(requestContent?.formId)
            String versionId = requiredId(requestContent?.formVersionId, 'formVersionId')
            long expected = requiredVersion(requestContent?.expectedVersion, 'expectedVersion')
            // Adapter must revalidate the stored schema inside the same transaction.
            Map result = formRepository.publishActiveDraftAtomically(
                formId, versionId, expected, access.currentUser, requestId, formSchemaValidator
            )
            return mutationResponse(result, requestId)
        }
    }

    private Map readOperation(String operation, Map requestContent, Closure action) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map access = requireFormAdmin(requestContent, requestId)
            if (access.errorResponse) return access.errorResponse
            return action(access, requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse('VALIDATION_ERROR', exception.message, [:], [], requestId)
        } catch (Exception exception) {
            safeLog(operation, requestId, exception)
            return internalError(requestId)
        }
    }

    private Map writeOperation(String operation, Map requestContent, Closure action) {
        return readOperation(operation, requestContent, action)
    }

    private static Map mutationResponse(Map result, String requestId) {
        if (result?.errorCode) {
            String code = result.errorCode.toString()
            List allowed = ['VERSION_CONFLICT', 'DUPLICATE', 'NOT_FOUND', 'VALIDATION_ERROR']
            if (!allowed.contains(code)) code = 'INTERNAL_ERROR'
            return CommonFunctions.errorResponse(
                code,
                result.safeMessage?.toString() ?: safeMutationMessage(code),
                result.fieldErrors instanceof Map ? result.fieldErrors : [:],
                result.details instanceof List ? result.details : [],
                requestId
            )
        }
        if (!(result?.data instanceof Map)) {
            throw new IllegalStateException('Project repository returned an invalid mutation result')
        }
        return CommonFunctions.successResponse(result.data, requestId)
    }

    private Map requireSafeSchema(def value) {
        if (!(value instanceof Map)) throw new IllegalArgumentException('schema должна быть JSON-объектом')
        if (!formSchemaValidator) throw new IllegalStateException('FormSchemaValidator is not configured')
        Map validation = formSchemaValidator.validate(value)
        if (validation?.valid != true) {
            throw new IllegalArgumentException(validation?.safeMessage?.toString() ?: 'Недопустимая схема формы')
        }
        return value as Map
    }

    private static Map normalizeFormInput(def value) {
        if (!(value instanceof Map)) throw new IllegalArgumentException('form обязателен')
        Map errors = [:]
        String code = CommonFunctions.requiredString(value as Map, 'code', errors)
        if (code?.size() > 100) errors.code = 'Максимум 100 символов'
        Map title = value.title instanceof Map ? value.title : [:]
        String titleRu = title.ru?.toString()?.trim()
        String titleEn = title.en?.toString()?.trim()
        if (!titleRu) errors['title.ru'] = 'Поле обязательно'
        if (titleRu?.size() > 300 || titleEn?.size() > 300) errors.title = 'Максимум 300 символов'
        if (errors) throw new IllegalArgumentException('Некорректные метаданные формы')
        return [code: code, title: [ru: titleRu, en: titleEn ?: ''], description: normalizeLocalized(value.description)]
    }

    private static Map normalizeLocalized(def value) {
        Map source = value instanceof Map ? value : [:]
        return [ru: source.ru?.toString()?.trim() ?: '', en: source.en?.toString()?.trim() ?: '']
    }

    private static long requiredVersion(def value, String field) {
        if (!(value instanceof Number) || value.longValue() < 0 || value.doubleValue() != value.longValue()) {
            throw new IllegalArgumentException("${field} должен быть неотрицательным целым числом")
        }
        return value.longValue()
    }

    private static String optionalId(def value) {
        String id = value?.toString()?.trim()
        return id ?: null
    }

    private static String safeMutationMessage(String code) {
        Map messages = [
            VERSION_CONFLICT: 'Объект уже изменён или у формы существует активный черновик',
            DUPLICATE: 'Объект с такими данными уже существует',
            NOT_FOUND: 'Форма или версия не найдена',
            VALIDATION_ERROR: 'Данные не прошли проверку',
            INTERNAL_ERROR: 'Внутренняя ошибка сервера'
        ]
        return messages[code]
    }

    private Map requireFormAdmin(Map requestContent, String requestId) {
        String token = requestContent?.sessionToken?.toString()
        Map session = token ? sessionRepository.findActiveByToken(token) : null
        if (!session) return [errorResponse: CommonFunctions.errorResponse(
            'INVALID_SESSION', 'Пользовательская сессия недействительна', [:], [], requestId
        )]
        if (session.expiresAt && session.expiresAt <= new Date()) {
            sessionRepository.revoke(session.id)
            return [errorResponse: CommonFunctions.errorResponse(
                'SESSION_EXPIRED', 'Срок пользовательской сессии истёк', [:], [], requestId
            )]
        }
        Map currentUser = [id: session.userId]
        List roles = permissionAdapter.rolesForUser(session.userId) ?: []
        if (!roles.contains('FORM_ADMIN') && !roles.contains('SYSTEM_ADMIN')) {
            return [errorResponse: CommonFunctions.errorResponse(
                'FORBIDDEN', 'Недостаточно прав', [:], [], requestId
            )]
        }
        currentUser.roles = roles
        return [currentUser: currentUser]
    }

    private Map requireAuthenticated(Map requestContent, String requestId) {
        String token = requestContent?.sessionToken?.toString()
        Map session = token ? sessionRepository.findActiveByToken(token) : null
        if (!session) return [errorResponse: CommonFunctions.errorResponse('INVALID_SESSION', 'Пользовательская сессия недействительна', [:], [], requestId)]
        if (session.expiresAt && session.expiresAt <= new Date()) {
            sessionRepository.revoke(session.id)
            return [errorResponse: CommonFunctions.errorResponse('SESSION_EXPIRED', 'Срок пользовательской сессии истёк', [:], [], requestId)]
        }
        List roles = permissionAdapter.rolesForUser(session.userId) ?: []
        return [currentUser: [id: session.userId, roles: roles]]
    }

    private static Map normalizeFilters(def value) {
        Map source = value instanceof Map ? value : [:]
        String search = source.search?.toString()?.trim() ?: ''
        if (search.size() > 200) throw new IllegalArgumentException('Строка поиска слишком длинная')
        List statuses = source.statuses instanceof List
            ? source.statuses.collect { it?.toString() }.findAll { it }.unique()
            : []
        if (statuses.any { !ALLOWED_STATUSES.contains(it) }) {
            throw new IllegalArgumentException('Недопустимый статус формы')
        }
        return [search: search, statuses: statuses]
    }

    private static List normalizeSort(def value) {
        List source = value instanceof List ? value : []
        if (source.any { item ->
            !(item instanceof Map) ||
                !ALLOWED_SORT_FIELDS.contains(item.field?.toString()) ||
                !['asc', 'desc'].contains(item.direction?.toString())
        }) throw new IllegalArgumentException('Недопустимая сортировка')
        List normalized = source.collect { item ->
            [field: item.field.toString(), direction: item.direction.toString()]
        }
        return normalized ?: [[field: 'updatedAt', direction: 'desc']]
    }

    private static Map normalizePageResult(Map result, int page, int pageSize) {
        long total = result?.total instanceof Number ? result.total.longValue() : 0L
        int totalPages = total ? Math.ceil(total / (double) pageSize) as int : 0
        return [
            items: result?.items instanceof List ? result.items : [],
            page: page,
            pageSize: pageSize,
            total: total,
            totalPages: totalPages
        ]
    }

    private static int normalizePage(def value) {
        int page = value instanceof Number ? value.intValue() : 1
        return page > 0 ? page : 1
    }

    private static int normalizePageSize(def value) {
        int pageSize = value instanceof Number ? value.intValue() : 20
        return Math.max(1, Math.min(pageSize, 100))
    }

    private static String normalizeLanguage(def value) {
        return value?.toString() == 'en' ? 'en' : 'ru'
    }

    private static String requiredId(def value, String field = 'formId') {
        String id = value?.toString()?.trim()
        if (!id) throw new IllegalArgumentException("${field} обязателен")
        return id
    }

    private static Map notFound(String requestId) {
        return CommonFunctions.errorResponse('NOT_FOUND', 'Форма не найдена', [:], [], requestId)
    }

    private static Map versionNotFound(String requestId) {
        return CommonFunctions.errorResponse('NOT_FOUND', 'Версия формы не найдена', [:], [], requestId)
    }

    private static Map internalError(String requestId) {
        return CommonFunctions.errorResponse('INTERNAL_ERROR', 'Внутренняя ошибка сервера', [:], [], requestId)
    }

    private void safeLog(String operation, String requestId, Exception exception) {
        logger?.error("${operation} failed, requestId=${requestId}, errorType=${exception.class.name}")
    }
}
