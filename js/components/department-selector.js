import { RemoteEntitySelector } from './remote-entity-selector.js';
export class DepartmentSelector extends RemoteEntitySelector {
  constructor(api, options = {}) { super({ ...options, load: (request) => api.getDepartments(request) }); }
}
