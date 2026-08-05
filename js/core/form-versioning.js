export const FORM_VERSION_STATUS = Object.freeze({
  DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED', ARCHIVED: 'ARCHIVED'
});

export function versionRefId(reference) {
  if (reference == null) return null;
  return typeof reference === 'object' ? reference.id ?? null : reference;
}

export function selectCurrentVersionId(form) {
  return versionRefId(form?.activeDraftVersionId ?? form?.activeDraftVersion)
    || versionRefId(form?.currentPublishedVersionId ?? form?.currentPublishedVersion);
}

export function hasActiveDraft(form) {
  return Boolean(versionRefId(form?.activeDraftVersionId ?? form?.activeDraftVersion));
}

export function isEditableVersion(form, formVersion) {
  if (!formVersion || formVersion.status !== FORM_VERSION_STATUS.DRAFT) return false;
  return versionRefId(form?.activeDraftVersionId ?? form?.activeDraftVersion) === formVersion.id;
}

export function requireExpectedVersion(value, field = 'expectedVersion') {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(field + ' must be a non-negative integer');
  }
  return value;
}

export function draftSaveCommand(form, formVersion, schema) {
  if (!isEditableVersion(form, formVersion)) throw new Error('IMMUTABLE_FORM_VERSION');
  return {
    formId: form.id,
    formVersionId: formVersion.id,
    schema: structuredCloneSafe(schema),
    expectedVersion: requireExpectedVersion(formVersion.entityVersion)
  };
}

export function publishCommand(form, formVersion) {
  if (!isEditableVersion(form, formVersion)) throw new Error('IMMUTABLE_FORM_VERSION');
  return {
    formId: form.id,
    formVersionId: formVersion.id,
    expectedVersion: requireExpectedVersion(formVersion.entityVersion)
  };
}

export function cloneCommand(form, sourceVersion) {
  if (hasActiveDraft(form)) throw new Error('ACTIVE_DRAFT_EXISTS');
  if (!sourceVersion?.id) throw new TypeError('sourceVersion.id is required');
  return {
    formId: form.id,
    sourceVersionId: sourceVersion.id,
    expectedFormVersion: requireExpectedVersion(form.version, 'expectedFormVersion')
  };
}

function structuredCloneSafe(value) {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
