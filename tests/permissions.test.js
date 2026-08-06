import { PAGE_ROLES, ROLES, canAccessAdminSection, hasAnyRole, hasRole, normalizeRoles } from '../js/core/permissions.js';

QUnit.module('Permissions', () => {
  QUnit.test('нормализует и удаляет дубликаты ролей', (assert) => {
    assert.deepEqual(normalizeRoles([' USER ', 'USER', null, '']), ['USER']);
    assert.deepEqual(normalizeRoles(null), []);
  });

  QUnit.test('проверяет точную роль', (assert) => {
    const user = { roles: [ROLES.USER, ROLES.OPERATOR] };
    assert.true(hasRole(user, ROLES.OPERATOR));
    assert.false(hasRole(user, ROLES.FORM_ADMIN));
  });

  QUnit.test('SYSTEM_ADMIN наследует все роли', (assert) => {
    const user = { roles: [ROLES.SYSTEM_ADMIN] };
    assert.true(hasRole(user, ROLES.CATALOG_ADMIN));
    assert.true(hasAnyRole(user, PAGE_ROLES.slaEditor));
  });

  QUnit.test('пустой список ролей разрешает обычную защищённую страницу', (assert) => {
    assert.true(hasAnyRole({ roles: [ROLES.USER] }, []));
  });

  QUnit.test('список заявок доступен ролям заявок и системному администратору', (assert) => {
    assert.true(hasAnyRole([ROLES.USER], PAGE_ROLES.requests));
    assert.true(hasAnyRole([ROLES.OPERATOR], PAGE_ROLES.requests));
    assert.true(hasAnyRole([ROLES.SYSTEM_ADMIN], PAGE_ROLES.requests));
    assert.false(hasAnyRole([ROLES.FORM_ADMIN], PAGE_ROLES.requests));
  });

  QUnit.test('разделы администратора изолированы', (assert) => {
    const catalogAdmin = { roles: [ROLES.CATALOG_ADMIN] };
    assert.true(canAccessAdminSection(catalogAdmin, 'catalogEditor'));
    assert.false(canAccessAdminSection(catalogAdmin, 'forms'));
    assert.false(canAccessAdminSection(catalogAdmin, 'slaEditor'));
  });
});
