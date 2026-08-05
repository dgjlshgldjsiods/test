/**
 * Проектные entry-функции modules.newItsmTest.auth*.
 *
 * authenticationAdapter, sessionRepository и permissionAdapter — интерфейсы
 * данного приложения. Они НЕ являются встроенными API Naumen.
 * TODO(NAUMEN-AUTH): реализовать адаптер проверки учётных данных.
 * TODO(NAUMEN-SESSION): реализовать серверное хранение, TTL, отзыв и rotation.
 * TODO(NAUMEN-PERMISSIONS): сопоставить роли приложения с моделью Naumen.
 */
class AuthFunctions {
    def authenticationAdapter
    def sessionRepository
    def permissionAdapter
    def logger

    Map authLogin(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map fieldErrors = [:]
            String login = CommonFunctions.requiredString(requestContent, 'login', fieldErrors)
            String password = requestContent?.password?.toString()
            if (!password) fieldErrors.password = 'Поле обязательно'
            if (fieldErrors) {
                return CommonFunctions.errorResponse(
                    'VALIDATION_ERROR', 'Ошибка проверки данных', fieldErrors, [], requestId
                )
            }

            // Проектный адаптер. Запрещено логировать login/password как пару.
            Map authenticatedUser = authenticationAdapter.authenticate(login, password)
            if (!authenticatedUser) {
                return CommonFunctions.errorResponse(
                    'INVALID_CREDENTIALS', 'Неверный логин или пароль', [:], [], requestId
                )
            }

            List roles = permissionAdapter.rolesForUser(authenticatedUser.id) ?: []
            Map session = sessionRepository.create(authenticatedUser.id)
            return CommonFunctions.successResponse([
                sessionToken: session.token,
                expiresAt: session.expiresAt,
                user: publicUser(authenticatedUser, roles)
            ], requestId)
        } catch (Exception exception) {
            safeLog('authLogin', requestId, exception)
            return internalError(requestId)
        }
    }

    Map authLogout(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map session = requireSession(requestContent, requestId)
            if (session.errorResponse) return session.errorResponse
            sessionRepository.revoke(session.sessionId)
            return CommonFunctions.successResponse([loggedOut: true], requestId)
        } catch (Exception exception) {
            safeLog('authLogout', requestId, exception)
            return internalError(requestId)
        }
    }

    Map authRefresh(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map session = requireSession(requestContent, requestId)
            if (session.errorResponse) return session.errorResponse
            Map refreshed = sessionRepository.rotate(session.sessionId)
            return CommonFunctions.successResponse([
                sessionToken: refreshed.token,
                expiresAt: refreshed.expiresAt
            ], requestId)
        } catch (Exception exception) {
            safeLog('authRefresh', requestId, exception)
            return internalError(requestId)
        }
    }

    Map authGetCurrentUser(Map requestContent, def user) {
        String requestId = CommonFunctions.requestId(requestContent)
        try {
            Map session = requireSession(requestContent, requestId)
            if (session.errorResponse) return session.errorResponse
            Map currentUser = authenticationAdapter.findUserById(session.userId)
            if (!currentUser) {
                sessionRepository.revoke(session.sessionId)
                return CommonFunctions.errorResponse(
                    'INVALID_SESSION', 'Пользовательская сессия недействительна', [:], [], requestId
                )
            }
            List roles = permissionAdapter.rolesForUser(currentUser.id) ?: []
            return CommonFunctions.successResponse([
                user: publicUser(currentUser, roles),
                expiresAt: session.expiresAt
            ], requestId)
        } catch (Exception exception) {
            safeLog('authGetCurrentUser', requestId, exception)
            return internalError(requestId)
        }
    }

    private Map requireSession(Map requestContent, String requestId) {
        String token = requestContent?.sessionToken?.toString()
        if (!token) {
            return [errorResponse: CommonFunctions.errorResponse(
                'INVALID_SESSION', 'Пользовательская сессия недействительна', [:], [], requestId
            )]
        }

        Map session = sessionRepository.findActiveByToken(token)
        if (!session) {
            return [errorResponse: CommonFunctions.errorResponse(
                'INVALID_SESSION', 'Пользовательская сессия недействительна', [:], [], requestId
            )]
        }
        if (session.expiresAt && session.expiresAt <= new Date()) {
            sessionRepository.revoke(session.id)
            return [errorResponse: CommonFunctions.errorResponse(
                'SESSION_EXPIRED', 'Срок пользовательской сессии истёк', [:], [], requestId
            )]
        }
        return [sessionId: session.id, userId: session.userId, expiresAt: session.expiresAt]
    }

    private static Map publicUser(Map source, List roles) {
        return [
            id: source.id,
            login: source.login,
            title: source.title,
            language: source.language,
            timezone: source.timezone,
            roles: roles
        ]
    }

    private Map internalError(String requestId) {
        return CommonFunctions.errorResponse(
            'INTERNAL_ERROR', 'Внутренняя ошибка сервера', [:], [], requestId
        )
    }

    private void safeLog(String operation, String requestId, Exception exception) {
        // Только безопасные метаданные. Message/stack могут содержать входные данные.
        logger?.error(
            "${operation} failed, requestId=${requestId}, errorType=${exception.class.name}"
        )
    }
}
