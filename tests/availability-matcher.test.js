import { hasRestrictedAudience, isServiceAvailable, normalizeAvailability } from '../js/core/availability-matcher.js';

QUnit.module('Service availability', () => {
  const user = { id: 'user$1', departmentId: 'department$1', organizationIds: ['organization$1', 'organization$2'] };

  QUnit.test('ALL разрешает доступ любому авторизованному пользователю и очищает ограничения', (assert) => {
    assert.true(isServiceAvailable({ mode: 'ALL', userIds: ['other'] }, user));
    assert.deepEqual(normalizeAvailability({ mode: 'ALL', userIds: ['other'] }), {
      mode: 'ALL', userIds: [], departmentIds: [], organizationIds: []
    });
  });

  QUnit.test('RESTRICTED использует OR для пользователя, подразделения и всех организаций', (assert) => {
    assert.true(isServiceAvailable({ mode: 'RESTRICTED', userIds: ['user$1'] }, user));
    assert.true(isServiceAvailable({ mode: 'RESTRICTED', departmentIds: ['department$1'] }, user));
    assert.true(isServiceAvailable({ mode: 'RESTRICTED', organizationIds: ['organization$2'] }, user));
    assert.false(isServiceAvailable({ mode: 'RESTRICTED', organizationIds: ['organization$9'] }, user));
  });

  QUnit.test('RESTRICTED без пользователя или аудитории запрещает доступ', (assert) => {
    assert.false(isServiceAvailable({ mode: 'RESTRICTED' }, null));
    assert.false(isServiceAvailable({ mode: 'RESTRICTED' }, user));
    assert.false(hasRestrictedAudience({ mode: 'RESTRICTED' }));
  });

  QUnit.test('нормализация удаляет пустые значения и дубликаты', (assert) => {
    assert.deepEqual(normalizeAvailability({ mode: 'RESTRICTED', organizationIds: ['org$1', '', 'org$1'] }), {
      mode: 'RESTRICTED', userIds: [], departmentIds: [], organizationIds: ['org$1']
    });
  });
});
