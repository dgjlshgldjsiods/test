export class SlaApi {
  constructor(apiClient) { this.apiClient = apiClient; }
  getRules(request = {}) { return this.apiClient.exec('slaGetRules', request); }
  getRule(ruleId) { return this.apiClient.exec('slaGetRule', { ruleId }); }
  createRule(rule) { return this.apiClient.exec('slaCreateRule', { rule }); }
  updateRule(ruleId, changes, expectedVersion) { return this.apiClient.exec('slaUpdateRule', { ruleId, changes, expectedVersion }); }
  deleteRule(ruleId, expectedVersion) { return this.apiClient.exec('slaDeleteRule', { ruleId, expectedVersion }); }
  reorderRules(serviceId, ruleIds, expectedVersion) { return this.apiClient.exec('slaReorderRules', { serviceId: serviceId || null, ruleIds, expectedVersion }); }
  testRules(context, rules) { return this.apiClient.exec('slaTestRules', rules ? { context, rules } : { context }); }
  checkConflicts(serviceId, rules) { return this.apiClient.exec('slaCheckConflicts', { serviceId: serviceId || null, ...(rules ? { rules } : {}) }); }
  getCalendars(request = {}) { return this.apiClient.exec('calendarsGetList', request); }
  getCalendar(calendarId) { return this.apiClient.exec('calendarsGet', { calendarId }); }
  calculateDeadline(calendarId, startAt, durationMinutes) { return this.apiClient.exec('calendarsCalculateDeadline', { calendarId, startAt, durationMinutes }); }
}
