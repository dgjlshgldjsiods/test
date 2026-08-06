import { RemoteEntitySelector } from './remote-entity-selector.js';
export class FormVersionSelector extends RemoteEntitySelector {
  constructor(formsApi, options = {}) {
    super({ ...options, load: async () => {
      if (!options.getFormId()) return { items: [] };
      const result = await formsApi.getVersions(options.getFormId(), { page: 1, pageSize: 100 });
      return { ...result, items: (result.items || []).filter((item) => item.status === 'PUBLISHED') };
    }, getLabel: (item) => `v${item.versionNumber}` });
  }
}
