export class CatalogApi {
  constructor(apiClient) { this.apiClient = apiClient; }
  getTree(options = {}) { return this.apiClient.exec('catalogGetTree', options); }
  getAvailableTree(search = '') { return this.apiClient.exec('catalogGetAvailableTree', { search }); }
  getFolder(folderId) { return this.apiClient.exec('catalogGetFolder', { folderId }); }
  createFolder(folder) { return this.apiClient.exec('catalogCreateFolder', { folder }); }
  updateFolder(folderId, changes, expectedVersion) { return this.apiClient.exec('catalogUpdateFolder', { folderId, changes, expectedVersion }); }
  deleteFolder(folderId, expectedVersion) { return this.apiClient.exec('catalogDeleteFolder', { folderId, expectedVersion }); }
  getService(serviceId) { return this.apiClient.exec('catalogGetService', { serviceId }); }
  createService(service) { return this.apiClient.exec('catalogCreateService', { service }); }
  updateService(serviceId, changes, expectedVersion) { return this.apiClient.exec('catalogUpdateService', { serviceId, changes, expectedVersion }); }
  moveService(serviceId, targetFolderId, expectedVersion) { return this.apiClient.exec('catalogMoveService', { serviceId, targetFolderId, expectedVersion }); }
  changeServiceStatus(serviceId, status, expectedVersion) { return this.apiClient.exec('catalogChangeServiceStatus', { serviceId, status, expectedVersion }); }
  getServiceAvailability(serviceId) { return this.apiClient.exec('catalogGetServiceAvailability', { serviceId }); }
  updateServiceAvailability(serviceId, availability, expectedVersion) { return this.apiClient.exec('catalogUpdateServiceAvailability', { serviceId, availability, expectedVersion }); }
}
