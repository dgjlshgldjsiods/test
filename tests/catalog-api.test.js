import { CatalogApi } from '../js/api/catalog-api.js';
import { DictionariesApi } from '../js/api/dictionaries-api.js';

QUnit.module('Catalog and dictionary API', () => {
  QUnit.test('user catalog calls only catalogGetAvailableTree', async (assert) => {
    const calls = [];
    const api = new CatalogApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({ folders: [], services: [] }); } });
    await api.getAvailableTree('printer');
    assert.deepEqual(calls, [{ name: 'catalogGetAvailableTree', body: { search: 'printer' } }]);
  });

  QUnit.test('available service is selected only from the server-filtered tree', async (assert) => {
    const api = new CatalogApi({ exec() { return Promise.resolve({ services: [{ id: 'service$1' }] }); } });
    assert.deepEqual(await api.getAvailableService('service$1'), { id: 'service$1' });
    assert.strictEqual(await api.getAvailableService('hidden'), null);
  });

  QUnit.test('catalog commands preserve optimistic locking contracts', async (assert) => {
    const calls = [];
    const api = new CatalogApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({ version: 2 }); } });
    await api.updateFolder('folder$1', { sortOrder: 2 }, 4);
    await api.deleteFolder('folder$1', 5);
    await api.moveService('service$1', 'folder$2', 6);
    await api.changeServiceStatus('service$1', 'PUBLISHED', 7);
    assert.deepEqual(calls, [
      { name: 'catalogUpdateFolder', body: { folderId: 'folder$1', changes: { sortOrder: 2 }, expectedVersion: 4 } },
      { name: 'catalogDeleteFolder', body: { folderId: 'folder$1', expectedVersion: 5 } },
      { name: 'catalogMoveService', body: { serviceId: 'service$1', targetFolderId: 'folder$2', expectedVersion: 6 } },
      { name: 'catalogChangeServiceStatus', body: { serviceId: 'service$1', status: 'PUBLISHED', expectedVersion: 7 } }
    ]);
  });

  QUnit.test('dictionary selectors use business parameters in request bodies', async (assert) => {
    const calls = [];
    const api = new DictionariesApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({ items: [] }); } });
    await api.searchUsers({ search: 'Ann', page: 1, pageSize: 20, activeOnly: true });
    await api.getItems('SLA_POLICIES', { page: 1 });
    assert.deepEqual(calls, [
      { name: 'dictionariesSearchUsers', body: { search: 'Ann', page: 1, pageSize: 20, activeOnly: true } },
      { name: 'dictionariesGetItems', body: { page: 1, dictionaryCode: 'SLA_POLICIES' } }
    ]);
  });
});
