import { findPotentialSlaConflicts, matchSlaRules, matchesCondition } from '../js/core/sla-matcher.js';

QUnit.module('SLA matcher', () => {
  QUnit.test('selects first ordered enabled match and reports all conflicts', (assert) => {
    const rules = [
      { id: 'later', order: 20, enabled: true, conditions: [{ field: 'vip', operator: 'EQ', value: true }] },
      { id: 'off', order: 1, enabled: false, conditions: [{ operator: 'ANY' }] },
      { id: 'first', order: 10, enabled: true, conditions: [{ operator: 'ANY' }] }
    ];
    assert.deepEqual(matchSlaRules({ vip: true }, rules), { selectedRuleId: 'first', matchedRuleIds: ['first', 'later'], conflictRuleIds: ['later'] });
  });

  QUnit.test('supports every declared operator', (assert) => {
    const context = { priority: 2, tags: ['a', 'b'], blank: '', title: 'x' };
    assert.true(matchesCondition(context, { operator: 'ANY' }));
    assert.true(matchesCondition(context, { field: 'priority', operator: 'EQ', value: 2 }));
    assert.true(matchesCondition(context, { field: 'priority', operator: 'NE', value: 3 }));
    assert.true(matchesCondition(context, { field: 'tags', operator: 'IN', value: ['b'] }));
    assert.true(matchesCondition(context, { field: 'tags', operator: 'NOT_IN', value: ['c'] }));
    assert.true(matchesCondition(context, { field: 'blank', operator: 'EMPTY' }));
    assert.true(matchesCondition(context, { field: 'title', operator: 'NOT_EMPTY' }));
    assert.true(matchesCondition(context, { field: 'priority', operator: 'RANGE', value: { from: 1, to: 3 } }));
  });

  QUnit.test('overlap check is explicitly approximate', (assert) => {
    const warnings = findPotentialSlaConflicts([
      { id: 'a', enabled: true, conditions: [{ field: 'vip', operator: 'EQ', value: true }] },
      { id: 'b', enabled: true, conditions: [{ operator: 'ANY' }] },
      { id: 'c', enabled: true, conditions: [{ field: 'vip', operator: 'EQ', value: false }] }
    ]);
    assert.deepEqual(warnings, [{ ruleIds: ['a', 'b'], approximate: true }, { ruleIds: ['b', 'c'], approximate: true }]);
  });
});
