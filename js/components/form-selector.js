import { RemoteEntitySelector } from './remote-entity-selector.js';
export class FormSelector extends RemoteEntitySelector {
  constructor(formsApi, options = {}) {
    super({ ...options, load: (request) => formsApi.getList({ ...request, filters: {}, sort: [{ field: 'title', direction: 'asc' }] }) });
  }
}
