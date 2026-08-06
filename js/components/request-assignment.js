import { createElement } from './dom.js';
import { GroupSelector } from './group-selector.js';
import { UserSelector } from './user-selector.js';

export class RequestAssignment {
  constructor({ i18n, dictionariesApi, onSave }) {
    this.i18n = i18n; this.onSave = onSave;
    this.element = createElement('section', { className: 'card border-0 shadow-sm' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: i18n.t('requestCard.assignment') }));
    this.group = new GroupSelector(dictionariesApi, { label: i18n.t('requestCard.group'), emptyLabel: i18n.t('requestCard.notAssigned') });
    this.user = new UserSelector(dictionariesApi, { label: i18n.t('requestCard.assignee'), emptyLabel: i18n.t('requestCard.notAssigned') });
    body.append(label(i18n.t('requestCard.group')), this.group.element, label(i18n.t('requestCard.assignee')), this.user.element);
    this.save = createElement('button', { className: 'btn btn-primary mt-3', text: i18n.t('common.save'), attributes: { type: 'button' } });
    this.message = createElement('div', { className: 'small mt-2', attributes: { role: 'alert' } });
    this.save.addEventListener('click', () => this.submit()); body.append(this.save, this.message); this.element.append(body);
  }
  async setRequest(request) {
    await Promise.all([this.group.load(), this.user.load()]);
    ensureOption(this.group.select, request.responsibleGroupId, request.responsibleGroupTitle || request.responsibleGroup?.title);
    ensureOption(this.user.select, request.assigneeId, request.assigneeTitle || request.assignee?.title);
    this.group.setValue(request.responsibleGroupId); this.user.setValue(request.assigneeId);
  }
  async submit() {
    this.save.disabled = true; this.message.textContent = '';
    try { await this.onSave({ responsibleGroupId: this.group.getValue(), assigneeId: this.user.getValue() }); }
    catch (error) { this.message.className = 'small text-danger mt-2'; this.message.textContent = error?.code === 'VERSION_CONFLICT' ? this.i18n.t('requestCard.versionConflict') : this.i18n.t('requestCard.assignmentError'); }
    finally { this.save.disabled = false; }
  }
}
function label(text) { return createElement('label', { className: 'form-label mt-2', text }); }
function ensureOption(select, id, title) { if (id && !Array.from(select.options).some((item) => item.value === String(id))) select.append(createElement('option', { text: title || id, attributes: { value: id } })); }
