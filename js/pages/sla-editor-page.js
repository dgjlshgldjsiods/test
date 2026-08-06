import { initializeProtectedPage } from '../app.js';
import { apiClient } from '../auth.js';
import { SlaApi } from '../api/sla-api.js';
import { PAGE_ROLES } from '../core/permissions.js';
import { findPotentialSlaConflicts, matchSlaRules, SLA_OPERATORS } from '../core/sla-matcher.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { createEmptyState, createErrorState, createLoadingState } from '../components/page-states.js';

const FIELDS = ['importance', 'urgency', 'system', 'vip', 'organizationIds', 'departmentId', 'serviceId', 'category', 'authorId', 'requestedForId'];
const STATUSES = ['NEW', 'REGISTERED', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED', 'CANCELLED'];
const content = createElement('section', { className: 'sla-page' });
const page = await initializeProtectedPage({ titleKey: 'pages.slaEditor', activeNav: 'admin-sla', requiredRoles: PAGE_ROLES.slaEditor, content });

if (page?.accessStatus === 'ready') {
  const api = new SlaApi(apiClient); let rules = []; let rulesVersion = 0; let calendars = [];
  content.innerHTML = `<div class="card border-0 shadow-sm mb-3"><div class="card-body d-flex flex-wrap gap-2"><input class="form-control sla-service" data-service placeholder="${I18n.t('slaEditor.serviceId')}"><button class="btn btn-outline-primary" data-load>${I18n.t('common.search')}</button><button class="btn btn-primary ms-auto" data-new>${I18n.t('slaEditor.create')}</button></div></div><div data-state></div><div data-list></div><div class="row g-3 mt-1"><div class="col-lg-7" data-editor></div><div class="col-lg-5" data-test></div></div>`;
  const service = content.querySelector('[data-service]'); const stateRegion = content.querySelector('[data-state]');
  content.querySelector('[data-load]').onclick = load; content.querySelector('[data-new]').onclick = () => renderEditor();
  renderTest(); await Promise.all([load(), loadCalendars()]);

  async function load() {
    stateRegion.replaceChildren(createLoadingState(I18n));
    try {
      const result = await api.getRules({ serviceId: service.value.trim() || null, includeDisabled: true, page: 1, pageSize: 100 });
      rules = Array.isArray(result?.items) ? result.items : Array.isArray(result?.rules) ? result.rules : [];
      rulesVersion = result?.rulesVersion ?? result?.version ?? 0; stateRegion.replaceChildren(); renderList(); renderWarnings();
    } catch { stateRegion.replaceChildren(createErrorState(I18n, 'slaEditor.loadError')); }
  }
  async function loadCalendars() { try { const r = await api.getCalendars({ page: 1, pageSize: 100 }); calendars = r?.items || []; } catch { calendars = []; } }
  function renderList() {
    const region = content.querySelector('[data-list]'); if (!rules.length) { region.replaceChildren(createEmptyState(I18n, 'slaEditor.empty')); return; }
    const card = createElement('div', { className: 'card border-0 shadow-sm table-responsive' }); const table = createElement('table', { className: 'table align-middle mb-0' });
    table.innerHTML = `<thead><tr><th>${I18n.t('slaEditor.order')}</th><th>${I18n.t('slaEditor.title')}</th><th>${I18n.t('slaEditor.times')}</th><th>${I18n.t('slaEditor.enabled')}</th><th>${I18n.t('slaEditor.actions')}</th></tr></thead>`;
    const body = createElement('tbody');
    rules.forEach((rule, index) => { const tr = createElement('tr'); tr.innerHTML = `<td>${escapeText(rule.order ?? index + 1)}</td><td>${escapeText(rule.title || rule.id)}</td><td>${escapeText(rule.reactionTimeMinutes)} / ${escapeText(rule.resolutionTimeMinutes)} min</td><td>${rule.enabled === false ? I18n.t('common.no') : I18n.t('common.yes')}</td>`; const td = createElement('td');
      const group = createElement('div', { className: 'btn-group btn-group-sm' });
      group.append(button('↑', () => reorder(index, -1), index === 0), button('↓', () => reorder(index, 1), index === rules.length - 1), button(I18n.t('common.edit'), () => renderEditor(rule)), button(rule.enabled === false ? I18n.t('slaEditor.enable') : I18n.t('slaEditor.disable'), () => mutate(() => api.updateRule(rule.id, { enabled: rule.enabled === false }, rule.version))), button(I18n.t('slaEditor.delete'), () => page.modal.show({ title: I18n.t('slaEditor.delete'), body: I18n.t('slaEditor.deleteConfirm'), onConfirm: () => mutate(() => api.deleteRule(rule.id, rule.version)) })));
      td.append(group); tr.append(td); body.append(tr); }); table.append(body); card.append(table); region.replaceChildren(card);
  }
  function renderEditor(rule = null) {
    const conditions = rule?.conditions?.length ? rule.conditions : [{ field: 'importance', operator: 'ANY', value: null }];
    const card = createElement('form', { className: 'card border-0 shadow-sm' }); card.innerHTML = `<div class="card-body"><h2 class="h5">${I18n.t(rule ? 'slaEditor.edit' : 'slaEditor.create')}</h2><label class="form-label">${I18n.t('slaEditor.title')}<input name="title" class="form-control" required value="${escapeAttr(rule?.title || '')}"></label><div class="row g-2"><label class="col form-label">${I18n.t('slaEditor.reaction')}<input name="reaction" type="number" min="1" class="form-control" required value="${rule?.reactionTimeMinutes || 60}"></label><label class="col form-label">${I18n.t('slaEditor.resolution')}<input name="resolution" type="number" min="1" class="form-control" required value="${rule?.resolutionTimeMinutes || 480}"></label></div><label class="form-label w-100">${I18n.t('slaEditor.calendar')}<select name="calendar" class="form-select" required>${calendarOptions(calendars, rule?.calendarId)}</select></label><fieldset><legend class="h6">${I18n.t('slaEditor.conditions')}</legend><div data-conditions></div><button type="button" class="btn btn-sm btn-outline-secondary" data-add>${I18n.t('slaEditor.addCondition')}</button></fieldset><fieldset class="mt-3"><legend class="h6">${I18n.t('slaEditor.paused')}</legend><div data-statuses class="d-flex flex-wrap gap-3"></div></fieldset><div class="form-check mt-3"><input name="enabled" class="form-check-input" type="checkbox" ${rule?.enabled === false ? '' : 'checked'}><label class="form-check-label">${I18n.t('slaEditor.enabled')}</label></div><button class="btn btn-primary mt-3">${I18n.t('common.save')}</button></div>`;
    const rows = card.querySelector('[data-conditions]'); conditions.forEach((c) => addCondition(rows, c)); card.querySelector('[data-add]').onclick = () => addCondition(rows);
    const statuses = card.querySelector('[data-statuses]'); STATUSES.forEach((status) => { const label = createElement('label', { className: 'form-check' }); label.innerHTML = `<input class="form-check-input" type="checkbox" name="paused" value="${status}" ${rule?.pausedStatuses?.includes(status) ? 'checked' : ''}><span class="form-check-label">${I18n.t('requests.status.' + status)}</span>`; statuses.append(label); });
    card.onsubmit = (event) => { event.preventDefault(); const value = readRule(card, rule); mutate(() => rule ? api.updateRule(rule.id, value, rule.version) : api.createRule(value)); }; content.querySelector('[data-editor]').replaceChildren(card);
  }
  function addCondition(parent, condition = {}) { const row = createElement('div', { className: 'sla-condition row g-2 mb-2' }); row.innerHTML = `<div class="col"><select class="form-select" data-field>${FIELDS.map((x) => `<option ${x === condition.field ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="col"><select class="form-select" data-op>${SLA_OPERATORS.map((x) => `<option ${x === condition.operator ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="col"><input class="form-control" data-value value="${escapeAttr(formatValue(condition.value))}" placeholder='value / [values]'></div><div class="col-auto"><button type="button" class="btn btn-outline-danger">×</button></div>`; row.querySelector('button').onclick = () => row.remove(); parent.append(row); }
  function readRule(form, current) { const fd = new FormData(form); return { title: String(fd.get('title')).trim(), serviceId: service.value.trim() || null, enabled: fd.has('enabled'), order: current?.order ?? rules.length + 1, conditions: [...form.querySelectorAll('.sla-condition')].map((row) => ({ field: row.querySelector('[data-field]').value, operator: row.querySelector('[data-op]').value, value: parseValue(row.querySelector('[data-value]').value, row.querySelector('[data-op]').value) })), reactionTimeMinutes: Number(fd.get('reaction')), resolutionTimeMinutes: Number(fd.get('resolution')), calendarId: fd.get('calendar'), pausedStatuses: fd.getAll('paused') }; }
  function renderTest() { const card = createElement('div', { className: 'card border-0 shadow-sm' }); card.innerHTML = `<div class="card-body"><h2 class="h5">${I18n.t('slaEditor.test')}</h2><textarea class="form-control font-monospace" rows="8" data-context>{\n  "importance": "1",\n  "serviceId": ""\n}</textarea><div class="d-flex gap-2 mt-2"><button class="btn btn-outline-primary" data-run>${I18n.t('slaEditor.runTest')}</button><button class="btn btn-outline-secondary" data-conflicts>${I18n.t('slaEditor.checkConflicts')}</button></div><div class="mt-3" data-result></div><div class="mt-3" data-warnings></div></div>`; card.querySelector('[data-run]').onclick = async () => { try { const context = JSON.parse(card.querySelector('[data-context]').value); const preview = matchSlaRules(context, rules); const server = await api.testRules(context); card.querySelector('[data-result]').textContent = `${I18n.t('slaEditor.serverResult')}: ${JSON.stringify(server)}\n${I18n.t('slaEditor.preview')}: ${JSON.stringify(preview)}`; } catch (error) { card.querySelector('[data-result]').textContent = error.message; } }; card.querySelector('[data-conflicts]').onclick = async () => { try { const result = await api.checkConflicts(service.value.trim() || null); showWarnings(result?.warnings || result || []); } catch { showWarnings([]); } }; content.querySelector('[data-test]').replaceChildren(card); }
  function renderWarnings() { showWarnings(findPotentialSlaConflicts(rules)); }
  function showWarnings(warnings) { const region = content.querySelector('[data-warnings]'); if (!region) return; region.textContent = warnings.length ? `${I18n.t('slaEditor.approximateWarning')}: ${warnings.map((x) => (x.ruleIds || []).join(' ↔ ')).join(', ')}` : I18n.t('slaEditor.noWarnings'); }
  async function reorder(index, delta) { const ordered = [...rules]; [ordered[index], ordered[index + delta]] = [ordered[index + delta], ordered[index]]; await mutate(() => api.reorderRules(service.value.trim() || null, ordered.map((x) => x.id), rulesVersion)); }
  async function mutate(command) { try { await command(); page.toasts.show(I18n.t('slaEditor.saved'), 'success'); await load(); } catch (error) { page.toasts.show(I18n.t(error?.code === 'VERSION_CONFLICT' ? 'slaEditor.versionConflict' : 'slaEditor.commandError'), 'danger'); } }
}

function button(text, action, disabled = false) { const item = createElement('button', { className: 'btn btn-outline-secondary', text, attributes: { type: 'button', ...(disabled ? { disabled: '' } : {}) } }); item.onclick = action; return item; }
function calendarOptions(calendars, selected) { return `<option value="">—</option>` + calendars.map((x) => `<option value="${escapeAttr(x.id)}" ${x.id === selected ? 'selected' : ''}>${escapeText(x.title || x.id)}</option>`).join(''); }
function parseValue(raw, operator) { if (['ANY', 'EMPTY', 'NOT_EMPTY'].includes(operator)) return null; try { return JSON.parse(raw); } catch { return raw; } }
function formatValue(value) { return value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value); }
function escapeText(value) { return String(value ?? '—').replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x])); }
function escapeAttr(value) { return escapeText(value).replace(/"/g, '&quot;'); }
