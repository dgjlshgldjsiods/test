/**
 * Fail-closed entry points reserved for modules.newItsmTest.files*.
 *
 * The file API of the target Naumen installation has NOT been confirmed.
 * This class deliberately does not call /add-file, utils.readFileContent or any
 * other presumed Naumen method. FileAdapter is a project port, not a Naumen API.
 *
 * TODO(NAUMEN-FILES): after inspecting the target installation, implement and
 * inject FileAdapter, document exact supported upload/read/delete operations,
 * limits, ACL behaviour, streaming/multipart semantics and malware scanning.
 */
class FileFunctions {
    def sessionRepository
    def permissionAdapter
    def requestRepository
    def fileAdapter
    def logger

    Map filesUpload(Map requestContent, def user) {
        return unavailable('filesUpload', requestContent)
    }

    Map filesGet(Map requestContent, def user) {
        return unavailable('filesGet', requestContent)
    }

    Map filesDelete(Map requestContent, def user) {
        return unavailable('filesDelete', requestContent)
    }

    private Map unavailable(String operation, Map requestContent) {
        String requestId = CommonFunctions.requestId(requestContent)
        // Do not log requestContent: it may eventually contain file bytes,
        // sessionToken, original names or other sensitive metadata.
        logger?.warn("${operation} rejected: file integration is not configured, requestId=${requestId}")
        return CommonFunctions.errorResponse(
            'FILES_INTEGRATION_UNAVAILABLE',
            'Файловая интеграция текущей установки Naumen не подтверждена',
            [:],
            ['TODO(NAUMEN-FILES)'],
            requestId
        )
    }
}
