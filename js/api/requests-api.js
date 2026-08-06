export class RequestsApi {
  constructor(apiClient) { this.apiClient = apiClient; }

  create({ serviceId, formId, formVersionId, fieldValues, attachmentIds = [] }) {
    return this.apiClient.exec('requestsCreate', {
      serviceId, formId, formVersionId, fieldValues, attachmentIds
    });
  }

  getList(request = {}) {
    return this.apiClient.exec('requestsGetList', request);
  }

  get(entityId) { return this.apiClient.exec('requestsGet', { entityId }); }
  changeStatus(entityId, newStatus, expectedVersion, comment = '') {
    return this.apiClient.exec('requestsChangeStatus', { entityId, newStatus, comment, expectedVersion });
  }
  changeAssignment(entityId, responsibleGroupId, assigneeId, expectedVersion) {
    return this.apiClient.exec('requestsChangeAssignment', { entityId, responsibleGroupId, assigneeId, expectedVersion });
  }
  addComment(entityId, type, text, expectedVersion) {
    return this.apiClient.exec('requestsAddComment', { entityId, comment: { type, text }, expectedVersion });
  }
  getComments(entityId, request = {}) { return this.apiClient.exec('requestsGetComments', { ...request, entityId }); }
  getHistory(entityId, request = {}) { return this.apiClient.exec('requestsGetHistory', { ...request, entityId }); }
  getAttachments(entityId) { return this.apiClient.exec('requestsGetAttachments', { entityId }); }
  getSla(entityId) { return this.apiClient.exec('requestsGetSla', { entityId }); }

  getUserCreated(userId, request = {}) { return this.apiClient.exec('usersGetCreatedRequests', { ...request, userId }); }
  getUserAssigned(userId, request = {}) { return this.apiClient.exec('usersGetAssignedRequests', { ...request, userId }); }
  getUserGroup(userId, request = {}) { return this.apiClient.exec('usersGetGroupRequests', { ...request, userId }); }
}
