import { createElement } from './dom.js';
import { createSlaIndicator } from './sla-indicator.js';

export function createRequestSla(sla, i18n) {
  const card = createElement('section', { className: 'card border-0 shadow-sm' });
  const body = createElement('div', { className: 'card-body' });
  body.append(createElement('h2', { className: 'h5', text: i18n.t('requestCard.sla') }), createSlaIndicator(sla, i18n));
  const grid = createElement('dl', { className: 'row mb-0 mt-3' });
  add(grid, i18n.t('requestCard.reactionDeadline'), date(sla?.reactionDeadline, i18n));
  add(grid, i18n.t('requestCard.resolutionDeadline'), date(sla?.resolutionDeadline, i18n));
  add(grid, i18n.t('requestCard.remainingReaction'), duration(sla?.remainingReactionMinutes, i18n));
  add(grid, i18n.t('requestCard.remainingResolution'), duration(sla?.remainingResolutionMinutes, i18n));
  body.append(grid); card.append(body); return card;
}
function add(root, term, value) { root.append(createElement('dt', { className: 'col-6', text: term }), createElement('dd', { className: 'col-6', text: value })); }
function date(value, i18n) { const parsed = new Date(value); return value && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat(i18n.getLanguage(), { dateStyle: 'short', timeStyle: 'short' }).format(parsed) : '—'; }
function duration(value, i18n) { return value !== null && value !== undefined && Number.isFinite(Number(value)) ? i18n.t('requestCard.minutes', { count: Number(value) }) : '—'; }
