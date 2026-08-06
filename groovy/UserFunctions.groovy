/**
 * Entry-функции modules.newItsmTest.users*.
 * userRepository, requestRepository, sessionRepository, permissionAdapter,
 * directoryAdapter и auditAdapter — проектные порты, не встроенные API Naumen.
 * TODO(NAUMEN-USERS): сопоставить профиль и справочники с объектами Naumen.
 * TODO(PROFILE-EDIT): подтвердить production allowlist изменяемых атрибутов.
 */
class UserFunctions {
    static final Set<String> LANGUAGES = ['ru', 'en'] as Set
    static final Set<String> ROLES = ['USER', 'OPERATOR', 'CATALOG_ADMIN', 'FORM_ADMIN', 'SLA_ADMIN', 'SYSTEM_ADMIN'] as Set
    static final Set<String> SELF_FIELDS = ['language', 'timezone'] as Set
    static final Set<String> ADMIN_FIELDS = ['title', 'email', 'phone', 'active', 'organizationIds', 'departmentId', 'groupIds', 'roles', 'language', 'timezone'] as Set
    static final Set<String> SORT_FIELDS = ['number', 'title', 'status', 'serviceTitle', 'createdAt'] as Set
    static final Set<String> REQUEST_STATUSES = ['NEW', 'REGISTERED', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED', 'CANCELLED'] as Set

    def userRepository
    def requestRepository
    def sessionRepository
    def permissionAdapter
    def directoryAdapter
    def auditAdapter
    def logger

    Map usersGet(Map requestContent, def user) {
        return userOperation('usersGet', requestContent) { Map actor, String targetId, boolean admin, String requestId ->
            Map profile = userRepository.findProfile(targetId, actor, admin, requestContent?.language?.toString())
            return profile ? CommonFunctions.successResponse(profile, requestId) : notFound(requestId)
        }
    }

    Map usersUpdate(Map requestContent, def user) {
        return userOperation('usersUpdate', requestContent) { Map actor, String targetId, boolean admin, String requestId ->
            if (!(requestContent?.changes instanceof Map)) throw new IllegalArgumentException('changes должен быть JSON-объектом')
            Map changes = normalizeChanges(requestContent.changes, admin)
            long expected = requiredVersion(requestContent?.expectedVersion)
            Map result = userRepository.updateProfileAtomic(targetId, changes, expected, actor, requestId)
            if (!(result instanceof Map)) throw new IllegalStateException('UserRepository returned invalid result')
            if (result.errorCode) {
                String code = ['VERSION_CONFLICT', 'VALIDATION_ERROR', 'FORBIDDEN', 'NOT_FOUND'].contains(result.errorCode?.toString()) ? result.errorCode.toString() : 'INTERNAL_ERROR'
                return CommonFunctions.errorResponse(code, result.safeMessage?.toString() ?: 'Не удалось обновить профиль', result.fieldErrors instanceof Map ? result.fieldErrors : [:], [], requestId)
            }
            if (!(result.data instanceof Map)) throw new IllegalStateException('UserRepository returned update without data')
            auditAdapter?.record(actor.id, 'usersUpdate', targetId, requestId)
            return CommonFunctions.successResponse(result.data, requestId)
        }
    }

    Map usersGetCreatedRequests(Map requestContent, def user) { return requestPage('CREATED', 'usersGetCreatedRequests', requestContent) }
    Map usersGetAssignedRequests(Map requestContent, def user) { return requestPage('ASSIGNED', 'usersGetAssignedRequests', requestContent) }
    Map usersGetGroupRequests(Map requestContent, def user) { return requestPage('GROUP', 'usersGetGroupRequests', requestContent) }

    private Map requestPage(String kind, String operation, Map requestContent) {
        return userOperation(operation, requestContent) { Map actor, String targetId, boolean admin, String requestId ->
            int page = positiveInt(requestContent?.page, 1)
            int pageSize = positiveInt(requestContent?.pageSize, 10)
            if (pageSize > 100) throw new IllegalArgumentException('pageSize не должен превышать 100')
            Map filters = normalizeRequestFilters(requestContent?.filters)
            List<Map> sort = normalizeSort(requestContent?.sort)
            // Project repository applies target-user semantics, ACL, COUNT and
            // LIMIT/OFFSET server-side. GROUP uses trusted current group IDs.
            Map result = requestRepository.findUserRequestPage(kind, targetId, actor, admin, filters, sort, page, pageSize, requestContent?.language?.toString())
            return CommonFunctions.successResponse(normalizePage(result, page, pageSize), requestId)
        }
    }

    private Map userOperation(String operation, Map requestContent, Closure action) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map actor = requireUser(requestContent, requestId)
            if (actor.errorResponse) return actor.errorResponse
            String targetId = requestContent?.userId == null ? actor.id : text(requestContent.userId, 200, true)
            boolean admin = actor.roles.contains('SYSTEM_ADMIN')
            if (targetId != actor.id && !admin) return forbidden(requestId)
            return action(actor, targetId, admin, requestId)
        } catch (SecurityException exception) {
            return forbidden(requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse('VALIDATION_ERROR', exception.message, [:], [], requestId)
        } catch (Exception exception) {
            logger?.error("${operation} failed, requestId=${requestId}, errorType=${exception.class.name}")
            return CommonFunctions.errorResponse('INTERNAL_ERROR', 'Внутренняя ошибка сервера', [:], [], requestId)
        }
    }

    private Map requireUser(Map requestContent, String requestId) {
        String token = requestContent?.sessionToken?.toString()
        Map session = token ? sessionRepository.findActiveByToken(token) : null
        if (!session) return [errorResponse: CommonFunctions.errorResponse('INVALID_SESSION', 'Сессия недействительна', [:], [], requestId)]
        if (session.expiresAt && session.expiresAt <= new Date()) {
            sessionRepository.revoke(session.id)
            return [errorResponse: CommonFunctions.errorResponse('SESSION_EXPIRED', 'Сессия истекла', [:], [], requestId)]
        }
        List<String> roles = permissionAdapter?.rolesForUser(session.userId)
        if (!(roles instanceof List)) throw new IllegalStateException('PermissionAdapter returned invalid roles')
        return [id: session.userId.toString(), roles: roles.collect { it?.toString() }.findAll { it }]
    }

    private static Map normalizeChanges(Map raw, boolean admin) {
        Set<String> keys = raw.keySet().collect { it?.toString() } as Set
        Set<String> allowed = admin ? ADMIN_FIELDS : SELF_FIELDS
        if (!allowed.containsAll(keys)) throw new SecurityException('Попытка изменить защищённые поля')
        Map result = [:]
        if (keys.contains('language')) {
            String language = raw.language?.toString()
            if (!LANGUAGES.contains(language)) throw new IllegalArgumentException('Недопустимый язык')
            result.language = language
        }
        if (keys.contains('timezone')) result.timezone = timezone(raw.timezone)
        if (admin) {
            if (keys.contains('title')) result.title = text(raw.title, 200, true)
            if (keys.contains('email')) result.email = nullableText(raw.email, 254)
            if (keys.contains('phone')) result.phone = nullableText(raw.phone, 64)
            if (keys.contains('active')) {
                if (!(raw.active instanceof Boolean)) throw new IllegalArgumentException('active должен быть boolean')
                result.active = raw.active
            }
            if (keys.contains('organizationIds')) result.organizationIds = ids(raw.organizationIds, 'organizationIds')
            if (keys.contains('departmentId')) result.departmentId = nullableId(raw.departmentId)
            if (keys.contains('groupIds')) result.groupIds = ids(raw.groupIds, 'groupIds')
            if (keys.contains('roles')) {
                List<String> roles = ids(raw.roles, 'roles')
                if (roles.any { !ROLES.contains(it) }) throw new IllegalArgumentException('Недопустимая роль')
                result.roles = roles
            }
        }
        if (!result) throw new IllegalArgumentException('Нет разрешённых изменений')
        if (result.email && !(result.email ==~ /^[^\s@]+@[^\s@]+\.[^\s@]+$/)) throw new IllegalArgumentException('Недопустимый email')
        return result
    }

    private static Map normalizeRequestFilters(def raw) {
        if (raw != null && !(raw instanceof Map)) throw new IllegalArgumentException('filters должен быть JSON-объектом')
        Map value = raw instanceof Map ? raw : [:]
        List<String> statuses = value.statuses == null ? [] : ids(value.statuses, 'statuses')
        if (statuses.any { !REQUEST_STATUSES.contains(it) }) throw new IllegalArgumentException('Недопустимый статус заявки')
        return [search: nullableText(value.search, 200), statuses: statuses]
    }
    private static List<Map> normalizeSort(def raw) {
        List input = raw instanceof List ? raw : []
        if (input.size() > 3) throw new IllegalArgumentException('Слишком много полей сортировки')
        List<Map> result = input.collect { item ->
            if (!(item instanceof Map) || !SORT_FIELDS.contains(item.field?.toString()) || !(item.direction?.toString() in ['asc', 'desc'])) throw new IllegalArgumentException('Недопустимая сортировка')
            [field: item.field.toString(), direction: item.direction.toString()]
        }
        return result ?: [[field: 'createdAt', direction: 'desc']]
    }
    private static Map normalizePage(Map result, int page, int pageSize) {
        if (!(result instanceof Map) || !(result.items instanceof List)) throw new IllegalStateException('RequestRepository returned invalid page')
        int total = result.total instanceof Number ? Math.max(0, result.total as int) : 0
        return [items: result.items, page: page, pageSize: pageSize, total: total, totalPages: total ? (int) Math.ceil(total / (double) pageSize) : 0]
    }
    private static int positiveInt(def value, int fallback) {
        if (value == null) return fallback
        try {
            BigDecimal number = new BigDecimal(value.toString())
            if (number.stripTrailingZeros().scale() > 0 || number < 1 || number > Integer.MAX_VALUE) throw new IllegalArgumentException('Ожидалось положительное целое число')
            return number.intValueExact()
        } catch (ArithmeticException | NumberFormatException ignored) { throw new IllegalArgumentException('Ожидалось положительное целое число') }
    }
    private static long requiredVersion(def value) {
        if (value == null) throw new IllegalArgumentException('expectedVersion обязателен')
        try {
            BigDecimal number = new BigDecimal(value.toString())
            if (number.stripTrailingZeros().scale() > 0 || number < 0) throw new IllegalArgumentException('expectedVersion должен быть неотрицательным целым числом')
            return number.longValueExact()
        } catch (ArithmeticException | NumberFormatException ignored) { throw new IllegalArgumentException('expectedVersion должен быть неотрицательным целым числом') }
    }
    private static List<String> ids(def raw, String field) {
        if (!(raw instanceof Collection) || raw.size() > 100) throw new IllegalArgumentException("${field} должен быть массивом не более 100 элементов")
        return raw.collect { it?.toString()?.trim() }.findAll { it }.unique()
    }
    private static String timezone(def raw) {
        String value = text(raw, 64, true)
        if (!(value == 'UTC' || value ==~ /^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)+$/)) throw new IllegalArgumentException('Недопустимый часовой пояс')
        return value
    }
    private static String nullableId(def raw) { raw == null || !raw.toString().trim() ? null : text(raw, 200, true) }
    private static String nullableText(def raw, int max) { raw == null || !raw.toString().trim() ? null : text(raw, max, true) }
    private static String text(def raw, int max, boolean required) { String value = raw?.toString()?.trim(); if (required && !value) throw new IllegalArgumentException('Значение обязательно'); if (value?.length() > max) throw new IllegalArgumentException('Значение слишком длинное'); return value }
    private static Map forbidden(String requestId) { CommonFunctions.errorResponse('FORBIDDEN', 'Недостаточно прав', [:], [], requestId) }
    private static Map notFound(String requestId) { CommonFunctions.errorResponse('NOT_FOUND', 'Пользователь не найден или недоступен', [:], [], requestId) }
}
