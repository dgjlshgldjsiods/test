export class FormsApi {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  getList(request = {}) {
    return this.apiClient.exec('formsGetList', request);
  }

  get(formId) {
    return this.apiClient.exec('formsGet', { formId });
  }

  getVersions(formId, request = {}) {
    return this.apiClient.exec('formsGetVersions', { ...request, formId });
  }
}
