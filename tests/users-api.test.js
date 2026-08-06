import { UsersApi } from '../js/api/users-api.js';

QUnit.module('UsersApi', () => {
  QUnit.test('self profile omits userId and admin update sends allowlisted changes with version', async (assert) => {
    const calls = [];
    const api = new UsersApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({}); } });
    await api.get();
    await api.get('user$2');
    await api.update('user$2', { roles: ['OPERATOR'], organizationIds: ['org$1'] }, 7);
    assert.deepEqual(calls, [
      { name: 'usersGet', body: {} },
      { name: 'usersGet', body: { userId: 'user$2' } },
      { name: 'usersUpdate', body: { userId: 'user$2', changes: { roles: ['OPERATOR'], organizationIds: ['org$1'] }, expectedVersion: 7 } }
    ]);
  });
});
