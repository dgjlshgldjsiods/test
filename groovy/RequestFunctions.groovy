/**
 * Entry-функции заявок modules.newItsmTest.requests*.
 * Все зависимости ниже — проектные порты, не встроенные API Naumen.
 * TODO(NAUMEN-REQUESTS): сопоставить Request с реальным объектом/процессом.
 * TODO(IDEMPOTENCY): подтвердить атомарное хранилище результатов requestId.
 * TODO(SURVEY-VALIDATION): реализовать серверный allowlist и валидацию values.
 * TODO(NAUMEN-FILES): вложения на этом этапе не принимаются.
 * TODO(REQUEST-VISIBILITY): сопоставить правила видимости с объектными
 * политиками и рабочими группами конкретной инсталляции Naumen.
 */
class RequestFunctions {
    def requestRepository
    def catalogRepository
    def formRepository
    def directoryAdapter
    def permissionAdapter
    def submissionValidator
    def sessionRepository
    def auditAdapter
    def logger

    Map requestsGetList(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map currentUser = requireUser(requestContent, requestId)
            if (currentUser.errorResponse) return currentUser.errorResponse
            Set<String> roles = (currentUser.roles ?: []) as Set<String>
            if (!roles.intersect(['USER', 'OPERATOR', 'SYSTEM_ADMIN'] as Set).size()) {
                return CommonFunctions.errorResponse('FORBIDDEN', 'Недостаточно прав для просмотра заявок', [:], [], requestId)
            }

            int page = positiveInt(requestContent?.page, 1)
            int pageSize = boundedPageSize(requestContent?.pageSize)
            Map filters = normalizeFilters(requestContent?.filters)
            List<Map> sort = normalizeSort(requestContent?.sort)
            Map visibility = buildVisibility(currentUser, roles)

            // Project repository must apply visibility, filters, sorting, count
            // and LIMIT/OFFSET on the server. It must never fetch the full set.
            Map result = requestRepository.findVisiblePage(
                currentUser, visibility, filters, sort, page, pageSize,
                requestContent?.language?.toString()
            )
            if (!(result instanceof Map) || !(result.items instanceof List)) {
                throw new IllegalStateException('RequestRepository returned invalid page')
            }
            int total = result.total instanceof Number ? Math.max(0, result.total as int) : 0
            Map data = [
                items: result.items,
                page: page,
                pageSize: pageSize,
                total: total,
                totalPages: total == 0 ? 0 : (int) Math.ceil(total / (double) pageSize)
            ]
            return CommonFunctions.successResponse(data, requestId)
        } catch (IllegalArgumentException exception) {
            return validationError(exception.message, requestId)
        } catch (Exception exception) {
            logger?.error("requestsGetList failed, requestId=${requestId}, errorType=${exception.class.name}")
            return CommonFunctions.errorResponse('INTERNAL_ERROR', 'Внутренняя ошибка сервера', [:], [], requestId)
        }
    }

    Map requestsCreate(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map currentUser = requireUser(requestContent, requestId)
            if (currentUser.errorResponse) return currentUser.errorResponse
            String serviceId = requiredId(requestContent?.serviceId, 'serviceId')
            String formId = requiredId(requestContent?.formId, 'formId')
            String formVersionId = requiredId(requestContent?.formVersionId, 'formVersionId')
            if (!(requestContent?.fieldValues instanceof Map)) throw new IllegalArgumentException('fieldValues должен быть JSON-объектом')
            if ((requestContent?.attachmentIds instanceof List) && !requestContent.attachmentIds.isEmpty()) {
                throw new IllegalArgumentException('Вложения пока не поддерживаются')
            }

            Map userContext = directoryAdapter.getCatalogAccessContext(currentUser.id)
            if (!(userContext instanceof Map)) throw new IllegalStateException('DirectoryAdapter returned invalid context')
            userContext.id = currentUser.id

            // These project adapter calls are server-authoritative. Browser IDs
            // are references to verify, never proof of availability.
            Map service = catalogRepository.findAvailablePublishedService(serviceId, userContext)
            if (!service) return notFound(requestId)
            if (service.formId?.toString() != formId || service.formVersionId?.toString() != formVersionId) {
                return validationError('Услуга связана с другой версией формы', requestId)
            }
            Map version = formRepository.findPublishedVersion(formVersionId, formId)
            if (!version || version.status != 'PUBLISHED') return validationError('Версия формы недоступна', requestId)
            if (!submissionValidator) throw new IllegalStateException('SubmissionValidator is not configured')
            Map validation = submissionValidator.validate(version.schema, requestContent.fieldValues, currentUser)
            if (validation?.valid != true) {
                return CommonFunctions.errorResponse(
                    'VALIDATION_ERROR', validation?.safeMessage?.toString() ?: 'Данные формы не прошли проверку',
                    validation?.fieldErrors instanceof Map ? validation.fieldErrors : [:], [], requestId
                )
            }

            Map command = [
                serviceId: serviceId, formId: formId, formVersionId: formVersionId,
                fieldValues: validation.values instanceof Map ? validation.values : requestContent.fieldValues,
                authorId: currentUser.id, requestedForId: validation.requestedForId ?: currentUser.id,
                responsibleGroupId: service.responsibleGroupId,
                assigneeId: service.defaultAssigneeId,
                attachmentIds: []
            ]
            // Repository must return the original result for a repeated requestId.
            Map result = requestRepository.createIdempotent(requestId, command, currentUser)
            if (result?.errorCode) {
                String code = ['DUPLICATE', 'VALIDATION_ERROR', 'SLA_NOT_FOUND'].contains(result.errorCode?.toString())
                    ? result.errorCode.toString() : 'INTERNAL_ERROR'
                return CommonFunctions.errorResponse(code, result.safeMessage?.toString() ?: 'Создание заявки отклонено', result.fieldErrors instanceof Map ? result.fieldErrors : [:], [], requestId)
            }
            if (!(result?.data instanceof Map) || !(result.data.id || result.data.entityId)) {
                throw new IllegalStateException('RequestRepository returned invalid result')
            }
            auditAdapter?.record(currentUser.id, 'requestsCreate', result.data.id ?: result.data.entityId, requestId)
            return CommonFunctions.successResponse(result.data, requestId)
        } catch (IllegalArgumentException exception) {
            return validationError(exception.message, requestId)
        } catch (Exception exception) {
            logger?.error("requestsCreate failed, requestId=${requestId}, errorType=${exception.class.name}")
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
        List<String> roles = permissionAdapter?.getRoles(session.userId)
        if (!(roles instanceof List)) throw new IllegalStateException('PermissionAdapter returned invalid roles')
        return [id: session.userId, roles: roles.collect { it?.toString() }.findAll { it }]
    }

    private Map buildVisibility(Map currentUser, Set<String> roles) {
        if (roles.contains('SYSTEM_ADMIN')) return [mode: 'ALL']
        if (roles.contains('OPERATOR')) {
            Map context = directoryAdapter.getRequestAccessContext(currentUser.id)
            if (!(context instanceof Map)) throw new IllegalStateException('DirectoryAdapter returned invalid request context')
            return [mode: 'OPERATOR', userId: currentUser.id, groupIds: idList(context.groupIds ?: []), policyIds: idList(context.policyIds ?: [])]
        }
        return [mode: 'USER', userId: currentUser.id]
    }

    private static Map normalizeFilters(def raw) {
        if (raw != null && !(raw instanceof Map)) throw new IllegalArgumentException('filters должен быть JSON-объектом')
        Map source = raw instanceof Map ? raw : [:]
        List<String> statuses = source.statuses == null ? [] : idList(source.statuses)
        Set<String> allowedStatuses = ['NEW', 'REGISTERED', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED', 'CANCELLED'] as Set
        if (statuses.any { !allowedStatuses.contains(it) }) throw new IllegalArgumentException('Неизвестный статус заявки')
        def breached = source.slaBreached
        if (breached != null && !(breached instanceof Boolean)) throw new IllegalArgumentException('slaBreached должен быть boolean')
        return [
            search: shortText(source.search), number: shortText(source.number), title: shortText(source.title),
            statuses: statuses, service: shortText(source.service), author: shortText(source.author),
            requestedFor: shortText(source.requestedFor), responsibleGroup: shortText(source.responsibleGroup),
            assignee: shortText(source.assignee), slaBreached: breached,
            createdFrom: isoDate(source.createdFrom), createdTo: isoDate(source.createdTo),
            reactionDeadlineFrom: isoDate(source.reactionDeadlineFrom), reactionDeadlineTo: isoDate(source.reactionDeadlineTo),
            resolutionDeadlineFrom: isoDate(source.resolutionDeadlineFrom), resolutionDeadlineTo: isoDate(source.resolutionDeadlineTo)
        ]
    }

    private static List<Map> normalizeSort(def raw) {
        Set<String> allowed = ['number', 'title', 'serviceTitle', 'authorTitle', 'status', 'responsibleGroupTitle',
            'assigneeTitle', 'reactionDeadline', 'resolutionDeadline', 'createdAt'] as Set
        List input = raw instanceof List ? raw : []
        if (input.size() > 3) throw new IllegalArgumentException('Допускается не более трёх полей сортировки')
        List<Map> result = input.collect { item ->
            if (!(item instanceof Map) || !allowed.contains(item.field?.toString())) throw new IllegalArgumentException('Недопустимое поле сортировки')
            String direction = item.direction?.toString()?.toLowerCase()
            if (!(direction in ['asc', 'desc'])) throw new IllegalArgumentException('Недопустимое направление сортировки')
            [field: item.field.toString(), direction: direction]
        }
        return result ?: [[field: 'createdAt', direction: 'desc']]
    }

    private static int positiveInt(def value, int fallback) {
        if (value == null) return fallback
        try {
            BigDecimal decimal = new BigDecimal(value.toString())
            if (decimal.stripTrailingZeros().scale() > 0 || decimal > Integer.MAX_VALUE) {
                throw new IllegalArgumentException('page должен быть положительным целым числом')
            }
            int parsed = decimal.intValueExact()
            if (parsed < 1) throw new IllegalArgumentException('page должен быть положительным числом')
            return parsed
        } catch (ArithmeticException | NumberFormatException ignored) {
            throw new IllegalArgumentException('page должен быть положительным числом')
        }
    }

    private static int boundedPageSize(def value) {
        int size = positiveInt(value, 20)
        if (size > 100) throw new IllegalArgumentException('pageSize не должен превышать 100')
        return size
    }

    private static String shortText(def value) {
        String text = value?.toString()?.trim()
        if (text?.length() > 200) throw new IllegalArgumentException('Значение фильтра слишком длинное')
        return text ?: null
    }

    private static Date isoDate(def value) {
        if (value == null || !value.toString().trim()) return null
        try { return java.time.Instant.parse(value.toString()).toDate() }
        catch (Exception ignored) { throw new IllegalArgumentException('Дата должна быть в ISO 8601 с часовым поясом') }
    }

    private static List<String> idList(def value) {
        if (!(value instanceof Collection)) throw new IllegalArgumentException('Ожидался JSON-массив')
        return value.collect { it?.toString()?.trim() }.findAll { it }.unique()
    }

    private static String requiredId(def value, String field) {
        String id = value?.toString()?.trim()
        if (!id) throw new IllegalArgumentException("${field} обязателен")
        return id
    }
    private static Map validationError(String message, String requestId) { CommonFunctions.errorResponse('VALIDATION_ERROR', message ?: 'Ошибка проверки данных', [:], [], requestId) }
    private static Map notFound(String requestId) { CommonFunctions.errorResponse('NOT_FOUND', 'Услуга не найдена или недоступна', [:], [], requestId) }
}
