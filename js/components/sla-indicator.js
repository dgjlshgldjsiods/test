import { createElement } from './dom.js';

export function createSlaIndicator(sla, i18n) {
  if (!sla) return createElement('span', { className: 'text-body-secondary', text: '—' });
  const wrap = createElement('div', { className: 'd-flex flex-column gap-1 align-items-start' });
  if (sla.paused) wrap.append(badge(i18n.t('requests.sla.paused'), 'text-bg-warning'));
  if (sla.reactionBreached || sla.resolutionBreached) wrap.append(badge(i18n.t('requests.sla.breached'), 'text-bg-danger'));
  if (!sla.paused && !sla.reactionBreached && !sla.resolutionBreached) wrap.append(badge(i18n.t('requests.sla.onTime'), 'text-bg-success'));
  return wrap;
}

function badge(text, className) { return createElement('span', { className: `badge ${className}`, text }); }
