import { RemoteEntitySelector } from './remote-entity-selector.js';
export class SlaPolicySelector extends RemoteEntitySelector {
  constructor(api, options = {}) { super({ ...options, load: (request) => api.getItems('SLA_POLICIES', request) }); }
}
