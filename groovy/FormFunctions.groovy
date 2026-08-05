/**
 * Read-only entry-функции этапа 6 для modules.newItsmTest.forms*.
 *
 * formRepository, sessionRepository и permissionAdapter — проектные порты,
 * а не встроенные API Naumen.
 * TODO(NAUMEN-FORMS): сопоставить Form/FormVersion с реальными объектами Naumen.
 * TODO(NAUMEN-SESSION): подключить подтверждённое серверное хранилище сессий.
 * TODO(NAUMEN-PERMISSIONS): подключить подтверждённый источник ролей.
 */
class FormFunctions {
    static final Set ALLOWED_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as Set
    static final Set ALLOWED_SORT_FIELDS = ['code', 'title', 'status', 'updatedAt'] as Set

    def formRepository
    def sessionRepository
    def permissionAdapter
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

    private static String requiredId(def value) {
        String id = value?.toString()?.trim()
        if (!id) throw new IllegalArgumentException('formId обязателен')
        return id
    }

    private static Map notFound(String requestId) {
        return CommonFunctions.errorResponse('NOT_FOUND', 'Форма не найдена', [:], [], requestId)
    }

    private static Map internalError(String requestId) {
        return CommonFunctions.errorResponse('INTERNAL_ERROR', 'Внутренняя ошибка сервера', [:], [], requestId)
    }

    private void safeLog(String operation, String requestId, Exception exception) {
        logger?.error("${operation} failed, requestId=${requestId}, errorType=${exception.class.name}")
    }
}
