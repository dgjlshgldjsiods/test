import { RemoteEntitySelector } from './remote-entity-selector.js';
export class UserSelector extends RemoteEntitySelector {
  constructor(api, options = {}) { super({ ...options, load: (request) => api.searchUsers({ ...request, activeOnly: true }) }); }
}
