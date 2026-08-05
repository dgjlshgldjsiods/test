import {
  cloneCommand, draftSaveCommand, hasActiveDraft, isEditableVersion,
  publishCommand, requireExpectedVersion, selectCurrentVersionId
} from '../js/core/form-versioning.js';

QUnit.module('Form versioning', () => {
  const draft = { id: 'version$2', status: 'DRAFT', versionNumber: 2, entityVersion: 4 };
  const published = { id: 'version$1', status: 'PUBLISHED', versionNumber: 1, entityVersion: 2 };
  const form = { id: 'form$1', version: 7, activeDraftVersionId: draft.id, currentPublishedVersionId: published.id };

  QUnit.test('выбирает активный черновик перед опубликованной версией', (assert) => {
    assert.strictEqual(selectCurrentVersionId(form), draft.id);
    assert.strictEqual(selectCurrentVersionId({ currentPublishedVersion: published }), published.id);
    assert.true(hasActiveDraft(form));
  });

  QUnit.test('разрешает изменение только единственного активного DRAFT', (assert) => {
    assert.true(isEditableVersion(form, draft));
    assert.false(isEditableVersion(form, published));
    assert.false(isEditableVersion({ ...form, activeDraftVersionId: 'version$3' }, draft));
    assert.throws(() => draftSaveCommand(form, published, {}), /IMMUTABLE_FORM_VERSION/);
  });

  QUnit.test('save и publish используют optimistic-lock counter, но не вычисляют номер версии', (assert) => {
    assert.deepEqual(draftSaveCommand(form, draft, { pages: [] }), {
      formId: form.id, formVersionId: draft.id, schema: { pages: [] }, expectedVersion: 4
    });
    assert.deepEqual(publishCommand(form, draft), {
      formId: form.id, formVersionId: draft.id, expectedVersion: 4
    });
    assert.notOk(Object.hasOwn(publishCommand(form, draft), 'versionNumber'));
  });

  QUnit.test('clone запрещает второй черновик и передаёт expectedFormVersion', (assert) => {
    assert.throws(() => cloneCommand(form, published), /ACTIVE_DRAFT_EXISTS/);
    const withoutDraft = { ...form, activeDraftVersionId: null };
    assert.deepEqual(cloneCommand(withoutDraft, published), {
      formId: form.id, sourceVersionId: published.id, expectedFormVersion: 7
    });
  });

  QUnit.test('expectedVersion обязан быть неотрицательным целым', (assert) => {
    assert.strictEqual(requireExpectedVersion(0), 0);
    assert.throws(() => requireExpectedVersion(undefined), TypeError);
    assert.throws(() => requireExpectedVersion(1.5), TypeError);
  });
});
