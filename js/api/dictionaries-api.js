export class DictionariesApi {
  constructor(apiClient) { this.apiClient = apiClient; }
  getGroups(request = {}) { return this.apiClient.exec('dictionariesGetGroups', request); }
  getOrganizations(request = {}) { return this.apiClient.exec('dictionariesGetOrganizations', request); }
  getDepartments(request = {}) { return this.apiClient.exec('dictionariesGetDepartments', request); }
  getItems(dictionaryCode, request = {}) { return this.apiClient.exec('dictionariesGetItems', { ...request, dictionaryCode }); }
  getSurveyItems(dictionaryCode, request = {}) { return this.apiClient.exec('dictionariesGetItems', { ...request, dictionaryCode }); }
  searchUsers(request = {}) { return this.apiClient.exec('dictionariesSearchUsers', request); }
}
