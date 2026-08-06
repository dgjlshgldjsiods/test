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
}
