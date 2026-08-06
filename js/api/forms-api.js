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

  create(form, initialSchema) {
    return this.apiClient.exec('formsCreate', { form, initialSchema });
  }

  getVersions(formId, request = {}) {
    return this.apiClient.exec('formsGetVersions', { ...request, formId });
  }

  getVersion(formVersionId) {
    return this.apiClient.exec('formsGetVersion', { formVersionId });
  }

  getPublishedVersion(formVersionId, serviceId) {
    return this.apiClient.exec('formsGetVersion', { formVersionId, serviceId });
  }

  getRequestVersion(formVersionId, requestEntityId) {
    return this.apiClient.exec('formsGetVersion', { formVersionId, requestEntityId });
  }

  createVersion(formId, { sourceVersionId = null, schema = null, expectedFormVersion } = {}) {
    return this.apiClient.exec('formsCreateVersion', {
      formId, sourceVersionId, schema, expectedFormVersion
    });
  }

  cloneVersion(formId, sourceVersionId, expectedFormVersion) {
    return this.apiClient.exec('formsCloneVersion', {
      formId, sourceVersionId, expectedFormVersion
    });
  }

  saveDraft(formId, formVersionId, schema, expectedVersion) {
    return this.apiClient.exec('formsSaveDraft', {
      formId, formVersionId, schema, expectedVersion
    });
  }

  publishVersion(formId, formVersionId, expectedVersion) {
    return this.apiClient.exec('formsPublishVersion', {
      formId, formVersionId, expectedVersion
    });
  }
}
