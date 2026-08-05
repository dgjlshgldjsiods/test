import java.util.UUID

/**
 * Общая обвязка проектных REST-функций.
 *
 * Этот файл не описывает встроенный API Naumen. Способ публикации методов,
 * логирования и внедрения адаптеров необходимо проверить на реальном стенде.
 */
class CommonFunctions {
    static String requestId(Map requestContent) {
        return requestContent?.requestId?.toString()?.trim() ?: UUID.randomUUID().toString()
    }

    static Map successResponse(def data, String requestId) {
        return [success: true, data: data, requestId: requestId]
    }

    static Map errorResponse(
        String code,
        String message,
        Map fieldErrors,
        List details,
        String requestId
    ) {
        return [
            success: false,
            error: [
                code: code,
                message: message,
                fieldErrors: fieldErrors ?: [:],
                details: details ?: []
            ],
            requestId: requestId
        ]
    }

    static String requiredString(Map source, String field, Map fieldErrors) {
        String value = source?.get(field)?.toString()?.trim()
        if (!value) fieldErrors[field] = 'Поле обязательно'
        return value
    }
}
