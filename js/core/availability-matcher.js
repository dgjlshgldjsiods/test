export const AVAILABILITY_MODE = Object.freeze({ ALL: 'ALL', RESTRICTED: 'RESTRICTED' });

export function normalizeAvailability(value = {}) {
  const mode = value.mode === AVAILABILITY_MODE.RESTRICTED ? AVAILABILITY_MODE.RESTRICTED : AVAILABILITY_MODE.ALL;
  return {
    mode,
    userIds: mode === AVAILABILITY_MODE.ALL ? [] : uniqueIds(value.userIds),
    departmentIds: mode === AVAILABILITY_MODE.ALL ? [] : uniqueIds(value.departmentIds),
    organizationIds: mode === AVAILABILITY_MODE.ALL ? [] : uniqueIds(value.organizationIds)
  };
}

export function isServiceAvailable(availability, user) {
  const rule = normalizeAvailability(availability);
  if (rule.mode === AVAILABILITY_MODE.ALL) return true;
  if (!user) return false;
  const userOrganizations = uniqueIds(user.organizationIds);
  return rule.userIds.includes(String(user.id))
    || rule.departmentIds.includes(String(user.departmentId))
    || rule.organizationIds.some((id) => userOrganizations.includes(id));
}

export function hasRestrictedAudience(availability) {
  const rule = normalizeAvailability(availability);
  return rule.mode === AVAILABILITY_MODE.RESTRICTED
    && Boolean(rule.userIds.length || rule.departmentIds.length || rule.organizationIds.length);
}

function uniqueIds(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}
