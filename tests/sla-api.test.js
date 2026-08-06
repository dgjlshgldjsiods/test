import { SlaApi } from '../js/api/sla-api.js';

QUnit.module('SlaApi', () => {
  QUnit.test('uses SLA and calendar contracts with optimistic versions', async (assert) => {
    const calls = []; const api = new SlaApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({}); } });
    await api.getRules({ serviceId: 'service$1', includeDisabled: true });
    await api.updateRule('sla$1', { enabled: false }, 4);
    await api.reorderRules('service$1', ['sla$2', 'sla$1'], 7);
    await api.testRules({ vip: true });
    await api.getCalendars({ page: 1, pageSize: 100 });
    assert.deepEqual(calls, [
      { name: 'slaGetRules', body: { serviceId: 'service$1', includeDisabled: true } },
      { name: 'slaUpdateRule', body: { ruleId: 'sla$1', changes: { enabled: false }, expectedVersion: 4 } },
      { name: 'slaReorderRules', body: { serviceId: 'service$1', ruleIds: ['sla$2', 'sla$1'], expectedVersion: 7 } },
      { name: 'slaTestRules', body: { context: { vip: true } } },
      { name: 'calendarsGetList', body: { page: 1, pageSize: 100 } }
    ]);
  });
});
