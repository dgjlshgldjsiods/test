import { RemoteEntitySelector } from './remote-entity-selector.js';
export class GroupSelector extends RemoteEntitySelector {
  constructor(api, options = {}) { super({ ...options, load: (request) => api.getGroups(request) }); }
}
