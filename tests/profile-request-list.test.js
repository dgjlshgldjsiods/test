import { ProfileRequestList } from '../js/components/profile-request-list.js';

const i18n = { t: (key, params = {}) => key === 'pagination.total' ? `Total: ${params.total}` : key, getLanguage: () => 'en' };

QUnit.module('Profile request list', () => {
  QUnit.test('loads one server page and links to the request card', async (assert) => {
    const calls = [];
    const component = new ProfileRequestList({ i18n, title: 'Mine', load: async (request) => {
      calls.push(request);
      return { items: [{ id: 'request$1', number: 'REQ-1', title: 'Printer', status: 'NEW', createdAt: '2026-08-06T10:00:00Z' }], page: 1, pageSize: 10, total: 1, totalPages: 1 };
    } });
    document.querySelector('#qunit-fixture').append(component.element);
    await component.load();
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].pageSize, 10);
    assert.strictEqual(component.element.querySelector('a').getAttribute('href'), 'request-card.html?id=request%241');
  });
});
