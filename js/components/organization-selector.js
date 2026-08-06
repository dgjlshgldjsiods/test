import { RemoteEntitySelector } from './remote-entity-selector.js';
export class OrganizationSelector extends RemoteEntitySelector {
  constructor(api, options = {}) { super({ ...options, multiple: options.multiple ?? true, load: (request) => api.getOrganizations(request) }); }
}
