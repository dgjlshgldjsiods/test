/**
 * Проектные функции выбора справочных сущностей.
 * directoryAdapter/sessionRepository/permissionAdapter не являются API Naumen.
 * TODO(NAUMEN-DIRECTORY): подключить подтвержденные источники пользователей,
 * групп, подразделений, организаций и SLA-политик.
 */
class DictionaryFunctions {
    static final Set DICTIONARY_CODES = ['SLA_POLICIES'] as Set
    def directoryAdapter
    def sessionRepository
    def permissionAdapter
    def logger

    Map dictionariesGetGroups(Map requestContent, def user) { list('dictionariesGetGroups', requestContent) { access, search, page, size -> directoryAdapter.findGroups(access, search, page, size) } }
    Map dictionariesGetOrganizations(Map requestContent, def user) { list('dictionariesGetOrganizations', requestContent) { access, search, page, size -> directoryAdapter.findOrganizations(access, search, page, size) } }
    Map dictionariesGetDepartments(Map requestContent, def user) { list('dictionariesGetDepartments', requestContent) { access, search, page, size -> directoryAdapter.findDepartments(access, search, page, size) } }
    Map dictionariesSearchUsers(Map requestContent, def user) {
        return list('dictionariesSearchUsers', requestContent) { access, search, page, size ->
            directoryAdapter.findUsers(access, search, page, size, [activeOnly: requestContent?.activeOnly != false, organizationIds: ids(requestContent?.organizationIds), departmentIds: ids(requestContent?.departmentIds)])
        }
    }
    Map dictionariesGetItems(Map requestContent, def user) {
        String code = requestContent?.dictionaryCode?.toString()
        if (!DICTIONARY_CODES.contains(code)) return CommonFunctions.errorResponse('VALIDATION_ERROR', 'Недопустимый dictionaryCode', [:], [], CommonFunctions.requestId(requestContent))
        return list('dictionariesGetItems', requestContent) { access, search, page, size -> directoryAdapter.findDictionaryItems(code, access, search, page, size) }
    }

    private Map list(String operation, Map requestContent, Closure finder) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map currentUser = requireAdmin(requestContent)
            if (!currentUser) return CommonFunctions.errorResponse('INVALID_SESSION', 'Сессия недействительна', [:], [], requestId)
            if (currentUser.sessionExpired) return CommonFunctions.errorResponse('SESSION_EXPIRED', 'Сессия истекла', [:], [], requestId)
            if (!currentUser.allowed) return CommonFunctions.errorResponse('FORBIDDEN', 'Недостаточно прав', [:], [], requestId)
            String search = requestContent?.search?.toString()?.trim() ?: ''
            if (search.size() > 200) throw new IllegalArgumentException('Строка поиска слишком длинная')
            int page = requestContent?.page instanceof Number ? Math.max(1, requestContent.page.intValue()) : 1
            int size = requestContent?.pageSize instanceof Number ? Math.max(1, Math.min(100, requestContent.pageSize.intValue())) : 20
            Map result = finder(currentUser, search, page, size)
            long total = result?.total instanceof Number ? result.total.longValue() : 0
            return CommonFunctions.successResponse([items: result?.items ?: [], page: page, pageSize: size, total: total, totalPages: total ? Math.ceil(total / (double) size) as int : 0], requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse('VALIDATION_ERROR', exception.message, [:], [], requestId)
        } catch (Exception exception) {
            logger?.error("${operation} failed, requestId=${requestId}, errorType=${exception.class.name}")
            return CommonFunctions.errorResponse('INTERNAL_ERROR', 'Внутренняя ошибка сервера', [:], [], requestId)
        }
    }

    private Map requireAdmin(Map requestContent) {
        String token = requestContent?.sessionToken?.toString()
        Map session = token ? sessionRepository.findActiveByToken(token) : null
        if (!session) return null
        if (session.expiresAt && session.expiresAt <= new Date()) return [sessionExpired: true]
        List roles = permissionAdapter.rolesForUser(session.userId) ?: []
        return [id: session.userId, roles: roles, allowed: roles.any { ['CATALOG_ADMIN', 'SYSTEM_ADMIN'].contains(it) }]
    }
    private static List ids(def value) { value instanceof List ? value.collect { it?.toString()?.trim() }.findAll { it }.unique() : [] }
}
