export const SLA_OPERATORS = Object.freeze(['ANY', 'EQ', 'NE', 'IN', 'NOT_IN', 'EMPTY', 'NOT_EMPTY', 'RANGE']);

export function matchSlaRules(requestContext = {}, rules = []) {
  const matched = rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => rule?.enabled !== false)
    .sort((a, b) => number(a.rule.order) - number(b.rule.order) || a.index - b.index)
    .filter(({ rule }) => Array.isArray(rule.conditions) && rule.conditions.every((condition) => matchesCondition(requestContext, condition)))
    .map(({ rule }) => rule);
  const matchedRuleIds = matched.map((rule) => rule.id).filter(Boolean);
  return Object.freeze({
    selectedRuleId: matchedRuleIds[0] || null,
    matchedRuleIds,
    conflictRuleIds: matchedRuleIds.slice(1)
  });
}

export function matchesCondition(context, condition = {}) {
  const operator = String(condition.operator || '').toUpperCase();
  if (!SLA_OPERATORS.includes(operator)) return false;
  if (operator === 'ANY') return true;
  const actual = readPath(context, condition.field);
  const empty = actual == null || actual === '' || (Array.isArray(actual) && actual.length === 0);
  if (operator === 'EMPTY') return empty;
  if (operator === 'NOT_EMPTY') return !empty;
  if (operator === 'EQ') return equal(actual, condition.value);
  if (operator === 'NE') return !equal(actual, condition.value);
  if (operator === 'IN' || operator === 'NOT_IN') {
    const expected = Array.isArray(condition.value) ? condition.value : [];
    const actualValues = Array.isArray(actual) ? actual : [actual];
    const intersects = actualValues.some((item) => expected.some((value) => equal(item, value)));
    return operator === 'IN' ? intersects : !intersects;
  }
  if (operator === 'RANGE') {
    const range = Array.isArray(condition.value)
      ? { from: condition.value[0], to: condition.value[1] }
      : (condition.value || {});
    const value = comparable(actual); const from = comparable(range.from); const to = comparable(range.to);
    return value != null && from != null && to != null && value >= from && value <= to;
  }
  return false;
}

export function findPotentialSlaConflicts(rules = []) {
  const active = rules.filter((rule) => rule?.enabled !== false);
  const warnings = [];
  for (let left = 0; left < active.length; left += 1) {
    for (let right = left + 1; right < active.length; right += 1) {
      if (serviceOverlap(active[left], active[right]) && mayOverlap(active[left].conditions, active[right].conditions)) {
        warnings.push(Object.freeze({ ruleIds: [active[left].id, active[right].id].filter(Boolean), approximate: true }));
      }
    }
  }
  return warnings;
}

function mayOverlap(left = [], right = []) {
  const byField = (conditions) => new Map(conditions.filter((item) => item.operator !== 'ANY').map((item) => [item.field, item]));
  const a = byField(left); const b = byField(right);
  for (const [field, condition] of a) {
    const other = b.get(field);
    if (other && definitelyDisjoint(condition, other)) return false;
  }
  return true;
}

function definitelyDisjoint(a, b) {
  if (a.operator === 'EQ' && b.operator === 'EQ') return !equal(a.value, b.value);
  if (a.operator === 'EQ' && b.operator === 'IN') return !b.value?.some((value) => equal(value, a.value));
  if (b.operator === 'EQ' && a.operator === 'IN') return !a.value?.some((value) => equal(value, b.value));
  if (a.operator === 'EMPTY' && b.operator === 'NOT_EMPTY' || a.operator === 'NOT_EMPTY' && b.operator === 'EMPTY') return true;
  return false;
}

function serviceOverlap(a, b) { return !a.serviceId || !b.serviceId || a.serviceId === b.serviceId; }
function readPath(source, path) {
  if (!path || typeof path !== 'string') return undefined;
  return path.split('.').reduce((value, key) => ['__proto__', 'prototype', 'constructor'].includes(key) ? undefined : value?.[key], source);
}
function equal(a, b) { return a === b || (a != null && b != null && String(a) === String(b)); }
function number(value) { return Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER; }
function comparable(value) {
  if (value == null || value === '') return null;
  const numeric = Number(value); if (Number.isFinite(numeric)) return numeric;
  const timestamp = Date.parse(value); return Number.isNaN(timestamp) ? String(value) : timestamp;
}
