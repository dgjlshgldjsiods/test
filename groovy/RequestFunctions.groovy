/**
 * Entry-функции заявок modules.newItsmTest.requests*.
 * Все зависимости ниже — проектные порты, не встроенные API Naumen.
 * TODO(NAUMEN-REQUESTS): сопоставить Request с реальным объектом/процессом.
 * TODO(IDEMPOTENCY): подтвердить атомарное хранилище результатов requestId.
 * TODO(SURVEY-VALIDATION): реализовать серверный allowlist и валидацию values.
 * TODO(NAUMEN-FILES): вложения на этом этапе не принимаются.
 */
class RequestFunctions {
    def requestRepository
    def catalogRepository
    def formRepository
    def directoryAdapter
    def submissionValidator
    def sessionRepository
    def auditAdapter
    def logger

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
        return [id: session.userId]
    }

    private static String requiredId(def value, String field) {
        String id = value?.toString()?.trim()
        if (!id) throw new IllegalArgumentException("${field} обязателен")
        return id
    }
    private static Map validationError(String message, String requestId) { CommonFunctions.errorResponse('VALIDATION_ERROR', message ?: 'Ошибка проверки данных', [:], [], requestId) }
    private static Map notFound(String requestId) { CommonFunctions.errorResponse('NOT_FOUND', 'Услуга не найдена или недоступна', [:], [], requestId) }
}
