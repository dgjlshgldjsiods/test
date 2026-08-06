/**
 * Административные entry-функции каталога modules.newItsmTest.catalog*.
 * catalogRepository, sessionRepository, permissionAdapter и auditAdapter —
 * проектные порты, а не встроенные API Naumen.
 * TODO(NAUMEN-CATALOG): сопоставить папки/услуги с реальными объектами Naumen.
 * TODO(NAUMEN-TXN): подтвердить атомарный optimistic locking и проверки зависимостей.
 */
class CatalogFunctions {
    static final Set STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as Set
    def catalogRepository
    def sessionRepository
    def permissionAdapter
    def auditAdapter
    def logger

    Map catalogGetTree(Map requestContent, def user) {
        return execute('catalogGetTree', requestContent) { access, requestId ->
            Map result = catalogRepository.getAdminTree(access.currentUser, [
                includeArchived: requestContent?.includeArchived == true,
                includeDrafts: requestContent?.includeDrafts != false
            ])
            success([folders: result?.folders ?: [], services: result?.services ?: []], requestId)
        }
    }

    Map catalogGetFolder(Map requestContent, def user) {
        return findOne('catalogGetFolder', requestContent, 'folderId') { id, currentUser -> catalogRepository.findFolder(id, currentUser) }
    }

    Map catalogCreateFolder(Map requestContent, def user) {
        return mutate('catalogCreateFolder', requestContent) { access, requestId ->
            Map folder = normalizeFolder(requestContent?.folder)
            mutation(catalogRepository.createFolder(folder, access.currentUser, requestId), requestId)
        }
    }

    Map catalogUpdateFolder(Map requestContent, def user) {
        return mutate('catalogUpdateFolder', requestContent) { access, requestId ->
            String id = requiredId(requestContent?.folderId, 'folderId')
            long expected = requiredVersion(requestContent?.expectedVersion)
            Map changes = normalizeFolder(requestContent?.changes)
            mutation(catalogRepository.updateFolderAtomically(id, changes, expected, access.currentUser, requestId), requestId)
        }
    }

    Map catalogDeleteFolder(Map requestContent, def user) {
        return mutate('catalogDeleteFolder', requestContent) { access, requestId ->
            String id = requiredId(requestContent?.folderId, 'folderId')
            long expected = requiredVersion(requestContent?.expectedVersion)
            // Adapter checks children and services inside the same transaction.
            mutation(catalogRepository.deleteEmptyFolderAtomically(id, expected, access.currentUser, requestId), requestId)
        }
    }

    Map catalogGetServices(Map requestContent, def user) {
        return execute('catalogGetServices', requestContent) { access, requestId ->
            int page = page(requestContent?.page), pageSize = pageSize(requestContent?.pageSize)
            Map result = catalogRepository.findServicesPage(access.currentUser, requestContent?.filters ?: [:], requestContent?.sort ?: [], page, pageSize)
            success(pageResult(result, page, pageSize), requestId)
        }
    }

    Map catalogGetService(Map requestContent, def user) {
        return findOne('catalogGetService', requestContent, 'serviceId') { id, currentUser -> catalogRepository.findService(id, currentUser) }
    }

    Map catalogCreateService(Map requestContent, def user) {
        return mutate('catalogCreateService', requestContent) { access, requestId ->
            Map service = normalizeService(requestContent?.service, true)
            mutation(catalogRepository.createService(service, access.currentUser, requestId), requestId)
        }
    }

    Map catalogUpdateService(Map requestContent, def user) {
        return mutate('catalogUpdateService', requestContent) { access, requestId ->
            String id = requiredId(requestContent?.serviceId, 'serviceId')
            long expected = requiredVersion(requestContent?.expectedVersion)
            Map changes = normalizeService(requestContent?.changes, false)
            mutation(catalogRepository.updateServiceAtomically(id, changes, expected, access.currentUser, requestId), requestId)
        }
    }

    Map catalogMoveService(Map requestContent, def user) {
        return mutate('catalogMoveService', requestContent) { access, requestId ->
            String id = requiredId(requestContent?.serviceId, 'serviceId')
            String target = requiredId(requestContent?.targetFolderId, 'targetFolderId')
            long expected = requiredVersion(requestContent?.expectedVersion)
            mutation(catalogRepository.moveServiceAtomically(id, target, expected, access.currentUser, requestId), requestId)
        }
    }

    Map catalogChangeServiceStatus(Map requestContent, def user) {
        return mutate('catalogChangeServiceStatus', requestContent) { access, requestId ->
            String id = requiredId(requestContent?.serviceId, 'serviceId')
            String status = requestContent?.status?.toString()
            if (!STATUSES.contains(status)) throw new IllegalArgumentException('Недопустимый статус услуги')
            long expected = requiredVersion(requestContent?.expectedVersion)
            // Adapter rechecks published formVersion and required assignments on PUBLISHED.
            mutation(catalogRepository.changeServiceStatusAtomically(id, status, expected, access.currentUser, requestId), requestId)
        }
    }

    Map catalogGetServiceAvailability(Map requestContent, def user) {
        return execute('catalogGetServiceAvailability', requestContent) { access, requestId ->
            String id = requiredId(requestContent?.serviceId, 'serviceId')
            Map availability = catalogRepository.getServiceAvailability(id, access.currentUser)
            availability == null ? notFound(requestId) : success(availability, requestId)
        }
    }

    Map catalogUpdateServiceAvailability(Map requestContent, def user) {
        return mutate('catalogUpdateServiceAvailability', requestContent) { access, requestId ->
            String id = requiredId(requestContent?.serviceId, 'serviceId')
            long expected = requiredVersion(requestContent?.expectedVersion)
            Map availability = normalizeAvailability(requestContent?.availability)
            mutation(catalogRepository.updateAvailabilityAtomically(id, availability, expected, access.currentUser, requestId), requestId)
        }
    }

    private Map findOne(String operation, Map requestContent, String field, Closure finder) {
        return execute(operation, requestContent) { access, requestId ->
            Map value = finder(requiredId(requestContent?.get(field), field), access.currentUser)
            value ? success(value, requestId) : notFound(requestId)
        }
    }

    private Map mutate(String operation, Map requestContent, Closure action) {
        return execute(operation, requestContent) { access, requestId ->
            Map response = action(access, requestId)
            if (response?.success) auditAdapter?.record(access.currentUser.id, operation, response.data?.id, requestId)
            response
        }
    }

    private Map execute(String operation, Map requestContent, Closure action) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map access = requireAdmin(requestContent, requestId)
            if (access.errorResponse) return access.errorResponse
            return action(access, requestId)
        } catch (IllegalArgumentException exception) {
            return CommonFunctions.errorResponse('VALIDATION_ERROR', exception.message, [:], [], requestId)
        } catch (Exception exception) {
            logger?.error("${operation} failed, requestId=${requestId}, errorType=${exception.class.name}")
            return CommonFunctions.errorResponse('INTERNAL_ERROR', 'Внутренняя ошибка сервера', [:], [], requestId)
        }
    }

    private Map requireAdmin(Map requestContent, String requestId) {
        String token = requestContent?.sessionToken?.toString()
        Map session = token ? sessionRepository.findActiveByToken(token) : null
        if (!session) return [errorResponse: CommonFunctions.errorResponse('INVALID_SESSION', 'Сессия недействительна', [:], [], requestId)]
        if (session.expiresAt && session.expiresAt <= new Date()) return [errorResponse: CommonFunctions.errorResponse('SESSION_EXPIRED', 'Сессия истекла', [:], [], requestId)]
        List roles = permissionAdapter.rolesForUser(session.userId) ?: []
        if (!roles.contains('CATALOG_ADMIN') && !roles.contains('SYSTEM_ADMIN')) return [errorResponse: CommonFunctions.errorResponse('FORBIDDEN', 'Недостаточно прав', [:], [], requestId)]
        return [currentUser: [id: session.userId, roles: roles]]
    }

    private static Map normalizeFolder(def value) {
        if (!(value instanceof Map)) throw new IllegalArgumentException('folder обязателен')
        return [title: localized(value.title, true), parentFolderId: optionalId(value.parentFolderId), sortOrder: integer(value.sortOrder, 'sortOrder')]
    }

    private static Map normalizeService(def value, boolean creating) {
        if (!(value instanceof Map)) throw new IllegalArgumentException(creating ? 'service обязателен' : 'changes обязателен')
        Map normalized = [:]
        ['code', 'title', 'shortDescription', 'description', 'icon', 'folderId', 'formId', 'formVersionId', 'responsibleGroupId', 'defaultAssigneeId', 'slaPolicyId', 'sortOrder'].each { field ->
            if (value.containsKey(field)) normalized[field] = value[field]
        }
        if (normalized.containsKey('code')) {
            normalized.code = normalized.code?.toString()?.trim()
            if (!normalized.code || normalized.code.size() > 100) throw new IllegalArgumentException('Некорректный code')
        }
        if (normalized.containsKey('icon') && normalized.icon != null) {
            normalized.icon = normalized.icon.toString().trim()
            if (normalized.icon && !(normalized.icon ==~ /[a-z0-9-]{1,80}/)) throw new IllegalArgumentException('Недопустимый код иконки')
        }
        ['title', 'shortDescription', 'description'].each { field -> if (normalized.containsKey(field)) normalized[field] = localized(normalized[field], field == 'title') }
        ['folderId', 'formId', 'formVersionId', 'responsibleGroupId', 'defaultAssigneeId', 'slaPolicyId'].each { field -> if (normalized.containsKey(field)) normalized[field] = optionalId(normalized[field]) }
        if (normalized.containsKey('sortOrder')) normalized.sortOrder = integer(normalized.sortOrder, 'sortOrder')
        if (creating) {
            String status = value.status?.toString() ?: 'DRAFT'
            if (!STATUSES.contains(status)) throw new IllegalArgumentException('Недопустимый статус услуги')
            normalized.status = status
            normalized.availability = normalizeAvailability(value.availability)
        }
        return normalized
    }

    private static Map normalizeAvailability(def value) {
        Map source = value instanceof Map ? value : [:]
        String mode = source.mode?.toString() == 'RESTRICTED' ? 'RESTRICTED' : 'ALL'
        return [mode: mode, userIds: mode == 'ALL' ? [] : ids(source.userIds), departmentIds: mode == 'ALL' ? [] : ids(source.departmentIds), organizationIds: mode == 'ALL' ? [] : ids(source.organizationIds)]
    }

    private static Map localized(def value, boolean required) {
        Map source = value instanceof Map ? value : [:]
        String ru = source.ru?.toString()?.trim(), en = source.en?.toString()?.trim()
        if (required && !ru) throw new IllegalArgumentException('Русское название обязательно')
        if (ru?.size() > 1000 || en?.size() > 1000) throw new IllegalArgumentException('Локализованный текст слишком длинный')
        return [ru: ru ?: '', en: en ?: '']
    }

    private static List ids(def value) { value instanceof List ? value.collect { it?.toString()?.trim() }.findAll { it }.unique() : [] }
    private static String optionalId(def value) { value?.toString()?.trim() ?: null }
    private static String requiredId(def value, String field) { String id = optionalId(value); if (!id) throw new IllegalArgumentException("${field} обязателен"); id }
    private static long requiredVersion(def value) { if (!(value instanceof Number) || value.longValue() < 0 || value.doubleValue() != value.longValue()) throw new IllegalArgumentException('expectedVersion должен быть целым'); value.longValue() }
    private static int integer(def value, String field) { if (!(value instanceof Number) || value.doubleValue() != value.intValue()) throw new IllegalArgumentException("${field} должен быть целым"); value.intValue() }
    private static int page(def value) { value instanceof Number && value.intValue() > 0 ? value.intValue() : 1 }
    private static int pageSize(def value) { Math.max(1, Math.min(value instanceof Number ? value.intValue() : 20, 100)) }
    private static Map pageResult(Map result, int page, int size) { long total = result?.total instanceof Number ? result.total.longValue() : 0; [items: result?.items ?: [], page: page, pageSize: size, total: total, totalPages: total ? Math.ceil(total / (double) size) as int : 0] }
    private static Map mutation(Map result, String requestId) { result?.errorCode ? CommonFunctions.errorResponse(result.errorCode.toString(), result.safeMessage?.toString() ?: 'Операция отклонена', result.fieldErrors instanceof Map ? result.fieldErrors : [:], result.details instanceof List ? result.details : [], requestId) : success(result?.data, requestId) }
    private static Map success(def data, String requestId) { CommonFunctions.successResponse(data, requestId) }
    private static Map notFound(String requestId) { CommonFunctions.errorResponse('NOT_FOUND', 'Объект не найден', [:], [], requestId) }
}
