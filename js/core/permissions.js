export const ROLES = Object.freeze({
  USER: 'USER',
  OPERATOR: 'OPERATOR',
  CATALOG_ADMIN: 'CATALOG_ADMIN',
  FORM_ADMIN: 'FORM_ADMIN',
  SLA_ADMIN: 'SLA_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN'
});

export const PAGE_ROLES = Object.freeze({
  requests: Object.freeze([ROLES.USER, ROLES.OPERATOR]),
  catalogEditor: Object.freeze([ROLES.CATALOG_ADMIN]),
  forms: Object.freeze([ROLES.FORM_ADMIN]),
  formEditor: Object.freeze([ROLES.FORM_ADMIN]),
  slaEditor: Object.freeze([ROLES.SLA_ADMIN])
});

export function normalizeRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return [...new Set(roles.filter((role) => typeof role === 'string').map((role) => role.trim()).filter(Boolean))];
}

export function hasRole(userOrRoles, requiredRole) {
  const roles = getRoles(userOrRoles);
  return roles.includes(ROLES.SYSTEM_ADMIN) || roles.includes(requiredRole);
}

export function hasAnyRole(userOrRoles, requiredRoles = []) {
  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => hasRole(userOrRoles, role));
}

export function canAccessAdminSection(userOrRoles, section) {
  return hasAnyRole(userOrRoles, PAGE_ROLES[section] || []);
}

function getRoles(userOrRoles) {
  return normalizeRoles(Array.isArray(userOrRoles) ? userOrRoles : userOrRoles?.roles);
}
