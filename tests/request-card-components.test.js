import { RequestComments } from '../js/components/request-comments.js';
import { RequestHistory } from '../js/components/request-history.js';
import { createRequestSla } from '../js/components/request-sla.js';

const i18n = {
  t(key, params = {}) { return key === 'pagination.total' ? `Total: ${params.total}` : key === 'requestCard.minutes' ? `${params.count} min` : key; },
  getLanguage() { return 'en'; }
};

QUnit.module('Request card components', () => {
  QUnit.test('USER comment editor does not offer INTERNAL type', async (assert) => {
    const component = new RequestComments({ i18n, canAddInternal: false, onLoad: async () => ({ items: [], total: 0 }), onAdd: async () => {} });
    document.querySelector('#qunit-fixture').append(component.element);
    await component.load();
    assert.deepEqual(Array.from(component.type.options, (item) => item.value), ['PUBLIC']);
    assert.true(component.list.textContent.includes('requestCard.noComments'));
  });

  QUnit.test('history renders only events returned by the server page', async (assert) => {
    const component = new RequestHistory({ i18n, onLoad: async () => ({ items: [{ eventType: 'STATUS_CHANGED', actorTitle: 'Operator', occurredAt: '2026-08-06T10:00:00Z' }], page: 1, totalPages: 1, total: 1 }) });
    document.querySelector('#qunit-fixture').append(component.element);
    await component.load();
    assert.strictEqual(component.list.children.length, 1);
    assert.true(component.list.textContent.includes('requestCard.events.STATUS_CHANGED'));
  });

  QUnit.test('SLA renders server-calculated remaining working minutes and breach', (assert) => {
    const element = createRequestSla({ resolutionBreached: true, remainingResolutionMinutes: -15 }, i18n);
    assert.true(element.textContent.includes('requests.sla.breached'));
    assert.true(element.textContent.includes('-15 min'));
  });
});
