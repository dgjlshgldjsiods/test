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
  const userId = user.id == null ? null : String(user.id);
  const departmentId = user.departmentId == null ? null : String(user.departmentId);
  return (userId !== null && rule.userIds.includes(userId))
    || (departmentId !== null && rule.departmentIds.includes(departmentId))
    || rule.organizationIds.some((id) => userOrganizations.includes(id));
}

export function hasRestrictedAudience(availability) {
  const rule = normalizeAvailability(availability);
  return rule.mode === AVAILABILITY_MODE.RESTRICTED
    && Boolean(rule.userIds.length || rule.departmentIds.length || rule.organizationIds.length);
}

// UX-only helper. It may narrow an already server-authorized result, but its
// output must never be used as proof of access or to restore omitted services.
export function filterAvailableServices(services, user) {
  if (!Array.isArray(services)) return [];
  return services.filter((service) => service?.status === 'PUBLISHED'
    && isServiceAvailable(service.availability, user));
}

function uniqueIds(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}
