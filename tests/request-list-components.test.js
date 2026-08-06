import { RequestFilters } from '../js/components/request-filters.js';
import { createSlaIndicator } from '../js/components/sla-indicator.js';

const i18n = { t: (key) => key };

QUnit.module('Request list components', () => {
  QUnit.test('filters normalize text, status, boolean and local date for the server body', (assert) => {
    const component = new RequestFilters({ i18n });
    document.querySelector('#qunit-fixture').append(component.element);
    component.form.elements.search.value = '  printer  ';
    component.form.elements.status.value = 'IN_PROGRESS';
    component.form.elements.slaBreached.value = 'true';
    component.form.elements.createdFrom.value = '2026-08-06T10:30';
    const value = component.getValue();
    assert.strictEqual(value.search, 'printer');
    assert.deepEqual(value.statuses, ['IN_PROGRESS']);
    assert.strictEqual(value.slaBreached, true);
    assert.ok(/^2026-08-06T\d{2}:30:00\.000Z$/.test(value.createdFrom), 'date is an ISO instant');
  });

  QUnit.test('SLA indicator exposes breached and paused states', (assert) => {
    const indicator = createSlaIndicator({ paused: true, resolutionBreached: true }, i18n);
    assert.strictEqual(indicator.querySelectorAll('.badge').length, 2);
    assert.true(indicator.textContent.includes('requests.sla.paused'));
    assert.true(indicator.textContent.includes('requests.sla.breached'));
  });
});
