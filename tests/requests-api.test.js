import { RequestsApi } from '../js/api/requests-api.js';

QUnit.module('RequestsApi', () => {
  QUnit.test('requestsCreate sends immutable form references and values in the body', async (assert) => {
    const calls = [];
    const api = new RequestsApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({ id: 'request$1' }); } });
    await api.create({
      serviceId: 'service$1', formId: 'form$1', formVersionId: 'version$2',
      fieldValues: { subject: 'Printer' }
    });
    assert.deepEqual(calls, [{ name: 'requestsCreate', body: {
      serviceId: 'service$1', formId: 'form$1', formVersionId: 'version$2',
      fieldValues: { subject: 'Printer' }, attachmentIds: []
    } }]);
  });

  QUnit.test('requestsGetList sends only the requested server page, filters and sort', async (assert) => {
    const calls = [];
    const api = new RequestsApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({ items: [], total: 0 }); } });
    const command = {
      page: 3, pageSize: 20,
      filters: { search: 'printer', statuses: ['IN_PROGRESS'], slaBreached: true },
      sort: [{ field: 'createdAt', direction: 'desc' }]
    };
    await api.getList(command);
    assert.deepEqual(calls, [{ name: 'requestsGetList', body: command }]);
  });
});
