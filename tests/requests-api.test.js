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

  QUnit.test('request card operations preserve entityId and expectedVersion in bodies', async (assert) => {
    const calls = [];
    const api = new RequestsApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({}); } });
    await api.get('request$1');
    await api.changeStatus('request$1', 'IN_PROGRESS', 4, 'Taken');
    await api.changeAssignment('request$1', 'group$2', 'user$3', 5);
    await api.addComment('request$1', 'INTERNAL', 'Note', 6);
    await api.getComments('request$1', { page: 2, pageSize: 10 });
    await api.getHistory('request$1', { page: 1, pageSize: 20 });
    await api.getAttachments('request$1');
    await api.getSla('request$1');
    assert.deepEqual(calls, [
      { name: 'requestsGet', body: { entityId: 'request$1' } },
      { name: 'requestsChangeStatus', body: { entityId: 'request$1', newStatus: 'IN_PROGRESS', comment: 'Taken', expectedVersion: 4 } },
      { name: 'requestsChangeAssignment', body: { entityId: 'request$1', responsibleGroupId: 'group$2', assigneeId: 'user$3', expectedVersion: 5 } },
      { name: 'requestsAddComment', body: { entityId: 'request$1', comment: { type: 'INTERNAL', text: 'Note' }, expectedVersion: 6 } },
      { name: 'requestsGetComments', body: { page: 2, pageSize: 10, entityId: 'request$1' } },
      { name: 'requestsGetHistory', body: { page: 1, pageSize: 20, entityId: 'request$1' } },
      { name: 'requestsGetAttachments', body: { entityId: 'request$1' } },
      { name: 'requestsGetSla', body: { entityId: 'request$1' } }
    ]);
  });

  QUnit.test('profile request lists use separate server-paginated functions', async (assert) => {
    const calls = [];
    const api = new RequestsApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({ items: [] }); } });
    const page = { page: 2, pageSize: 10, filters: {}, sort: [{ field: 'createdAt', direction: 'desc' }] };
    await api.getUserCreated('user$1', page);
    await api.getUserAssigned('user$1', page);
    await api.getUserGroup('user$1', page);
    assert.deepEqual(calls, [
      { name: 'usersGetCreatedRequests', body: { ...page, userId: 'user$1' } },
      { name: 'usersGetAssignedRequests', body: { ...page, userId: 'user$1' } },
      { name: 'usersGetGroupRequests', body: { ...page, userId: 'user$1' } }
    ]);
  });
});
