/**
 * Entry-функции modules.newItsmTest.sla* и calendars*.
 * slaRepository, sessionRepository, permissionAdapter, calendarAdapter и auditAdapter —
 * проектные порты, а не встроенные API Naumen.
 * TODO(NAUMEN-SLA): сопоставить правила с реальными объектами и атрибутами Naumen.
 * TODO(NAUMEN-CALENDAR): подключить подтверждённые календари, праздники и часовые пояса.
 * TODO(NAUMEN-TXN): подтвердить атомарность reorder и пересчёта с историей заявки.
 */
class SlaFunctions {
    static final Set OPERATORS = ['ANY','EQ','NE','IN','NOT_IN','EMPTY','NOT_EMPTY','RANGE'] as Set
    static final Set FIELDS = ['importance','urgency','system','vip','organizationIds','departmentId','serviceId','category','authorId','requestedForId'] as Set
    static final Set STATUSES = ['NEW','REGISTERED','IN_PROGRESS','WAITING_USER','RESOLVED','CLOSED','CANCELLED'] as Set
    def slaRepository, sessionRepository, permissionAdapter, calendarAdapter, auditAdapter, logger

    Map slaGetRules(Map body, def user) { read('slaGetRules', body) { access, id ->
        int page = positive(body.page, 1), size = Math.min(positive(body.pageSize, 100), 100)
        Map result = slaRepository.findPage(optionalId(body.serviceId), body.includeDisabled != false, page, size, access.currentUser)
        if (!(result?.items instanceof List)) throw new IllegalStateException('SlaRepository returned invalid page')
        int total = result.total instanceof Number ? result.total as int : result.items.size()
        ok([items:result.items, page:page, pageSize:size, total:total, totalPages:total ? Math.ceil(total/(double)size) as int : 0, rulesVersion:result.rulesVersion ?: 0], id)
    } }
    Map slaGetRule(Map body, def user) { read('slaGetRule', body) { access, id -> found(slaRepository.findById(requiredId(body.ruleId), access.currentUser), id) } }
    Map slaCreateRule(Map body, def user) { write('slaCreateRule', body) { access, id -> mutation(slaRepository.create(normalizeRule(body.rule), access.currentUser, id), id) } }
    Map slaUpdateRule(Map body, def user) { write('slaUpdateRule', body) { access, id -> mutation(slaRepository.update(requiredId(body.ruleId), normalizeChanges(body.changes), version(body.expectedVersion), access.currentUser, id), id) } }
    Map slaDeleteRule(Map body, def user) { write('slaDeleteRule', body) { access, id -> mutation(slaRepository.delete(requiredId(body.ruleId), version(body.expectedVersion), access.currentUser, id), id) } }
    Map slaReorderRules(Map body, def user) { write('slaReorderRules', body) { access, id ->
        List ids = idList(body.ruleIds, 'ruleIds'); if (!ids) throw new IllegalArgumentException('ruleIds обязателен')
        mutation(slaRepository.reorder(optionalId(body.serviceId), ids, version(body.expectedVersion), access.currentUser, id), id)
    } }
    Map slaTestRules(Map body, def user) { read('slaTestRules', body) { access, id ->
        Map context = normalizeContext(body.context); List rules = body.rules == null ? slaRepository.findEnabledForContext(context, access.currentUser) : normalizeRules(body.rules)
        ok(match(context, rules), id)
    } }
    Map slaCheckConflicts(Map body, def user) { read('slaCheckConflicts', body) { access, id ->
        List rules = body.rules == null ? slaRepository.findForConflictCheck(optionalId(body.serviceId), access.currentUser) : normalizeRules(body.rules)
        // Эвристический проектный анализатор обязан возвращать approximate:true.
        List warnings = (slaRepository.findPotentialConflicts(rules) ?: []).collect { (it as Map) + [approximate:true] }
        ok([warnings:warnings], id)
    } }
    Map slaCalculateForRequest(Map body, def user) { write('slaCalculateForRequest', body) { access, id -> mutation(slaRepository.calculateForRequest(requiredId(body.entityId), body.reason?.toString(), body.expectedVersion == null ? null : version(body.expectedVersion), access.currentUser, calendarAdapter, auditAdapter, id), id) } }
    Map calendarsGetList(Map body, def user) { read('calendarsGetList', body) { access, id -> ok(calendarAdapter.findPage(positive(body.page,1), Math.min(positive(body.pageSize,20),100), body.search?.toString()?.trim(), access.currentUser), id) } }
    Map calendarsGet(Map body, def user) { read('calendarsGet', body) { access, id -> found(calendarAdapter.findById(requiredId(body.calendarId), access.currentUser), id) } }
    Map calendarsCalculateDeadline(Map body, def user) { read('calendarsCalculateDeadline', body) { access, id -> ok([deadline:calendarAdapter.calculateDeadline(requiredId(body.calendarId), requiredDate(body.startAt), positive(body.durationMinutes, null), access.currentUser)], id) } }

    private Map read(String name, Map body, Closure action) { execute(name, body, false, action) }
    private Map write(String name, Map body, Closure action) { execute(name, body, true, action) }
    private Map execute(String name, Map body, boolean mutation, Closure action) { String id=CommonFunctions.requestId(body); try { Map access=authorize(body,id); if(access.errorResponse)return access.errorResponse; action(access,id) } catch(IllegalArgumentException e){ CommonFunctions.errorResponse('VALIDATION_ERROR',e.message,[:],[],id) } catch(Exception e){ if(e.message=='VERSION_CONFLICT') return CommonFunctions.errorResponse('VERSION_CONFLICT','Объект изменён',[:],[],id); logger?.error("${name} failed requestId=${id}",e); CommonFunctions.errorResponse('INTERNAL_ERROR','Внутренняя ошибка',[:],[],id) } }
    private Map authorize(Map body,String id){ Map session=sessionRepository.findActive(body.sessionToken?.toString()); if(!session)return [errorResponse:CommonFunctions.errorResponse('INVALID_SESSION','Сессия недействительна',[:],[],id)]; Map current=session.user as Map; if(!permissionAdapter.hasAnyRole(current,['SLA_ADMIN','SYSTEM_ADMIN']))return [errorResponse:CommonFunctions.errorResponse('FORBIDDEN','Недостаточно прав',[:],[],id)]; [currentUser:current] }
    private static Map normalizeRule(def raw){ if(!(raw instanceof Map))throw new IllegalArgumentException('rule должен быть объектом'); Map out=normalizeChanges(raw); ['title','conditions','reactionTimeMinutes','resolutionTimeMinutes','calendarId'].each{if(!out.containsKey(it))throw new IllegalArgumentException("${it} обязателен")}; out }
    private static Map normalizeChanges(def raw){ if(!(raw instanceof Map))throw new IllegalArgumentException('changes должен быть объектом'); Set allowed=['title','serviceId','enabled','order','conditions','reactionTimeMinutes','resolutionTimeMinutes','calendarId','pausedStatuses'] as Set; if(raw.keySet().any{!allowed.contains(it)})throw new IllegalArgumentException('Недопустимое поле'); Map out=[:]; raw.each{k,v-> if(k=='title')out[k]=text(v,200); else if(k in ['serviceId'])out[k]=optionalId(v); else if(k=='enabled'){if(!(v instanceof Boolean))throw new IllegalArgumentException('enabled должен быть boolean');out[k]=v} else if(k in ['order','reactionTimeMinutes','resolutionTimeMinutes'])out[k]=positive(v,null); else if(k=='calendarId')out[k]=requiredId(v); else if(k=='pausedStatuses'){out[k]=idList(v,k);if(out[k].any{!STATUSES.contains(it)})throw new IllegalArgumentException('Недопустимый статус')} else if(k=='conditions')out[k]=normalizeConditions(v)}; if(!out)throw new IllegalArgumentException('Нет изменений'); out }
    private static List normalizeConditions(def raw){ if(!(raw instanceof List)||!raw||raw.size()>20)throw new IllegalArgumentException('conditions должен содержать 1..20 элементов'); raw.collect{c->if(!(c instanceof Map)||!OPERATORS.contains(c.operator)||c.operator!='ANY'&&!FIELDS.contains(c.field))throw new IllegalArgumentException('Недопустимое условие'); [field:c.operator=='ANY'?null:c.field,operator:c.operator,value:c.operator in ['ANY','EMPTY','NOT_EMPTY']?null:c.value]} }
    private static Map normalizeContext(def raw){ if(!(raw instanceof Map)||raw.keySet().any{!FIELDS.contains(it)})throw new IllegalArgumentException('Недопустимый context'); raw as Map }
    private static List normalizeRules(def raw){ if(!(raw instanceof List)||raw.size()>100)throw new IllegalArgumentException('rules должен быть массивом'); raw.collect{item->Map rule=normalizeRule(item); if(item.id)rule.id=requiredId(item.id); rule} }
    private static Map match(Map context,List rules){ List matched=rules.findAll{it.enabled!=false}.sort{a,b->(a.order?:Integer.MAX_VALUE)<=>(b.order?:Integer.MAX_VALUE)}.findAll{r->r.conditions.every{c->condition(context,c)}}; List ids=matched.collect{it.id}.findAll{it}; [selectedRuleId:ids?ids[0]:null,matchedRuleIds:ids,conflictRuleIds:ids.drop(1)] }
    private static boolean condition(Map c,Map x){ def a=x.field?c[x.field]:null,v=x.value; switch(x.operator){case'ANY':return true;case'EQ':return a?.toString()==v?.toString();case'NE':return a?.toString()!=v?.toString();case'EMPTY':return a==null||a==''||(a instanceof Collection&&!a);case'NOT_EMPTY':return !(a==null||a==''||(a instanceof Collection&&!a));case'IN':return (a instanceof Collection?a:[a]).any{z->v instanceof Collection&&v.any{it?.toString()==z?.toString()}};case'NOT_IN':return !(a instanceof Collection?a:[a]).any{z->v instanceof Collection&&v.any{it?.toString()==z?.toString()}};case'RANGE':def f=v instanceof List?v[0]:v?.from,t=v instanceof List?v[1]:v?.to;return a!=null&&f!=null&&t!=null&&new BigDecimal(a.toString())>=new BigDecimal(f.toString())&&new BigDecimal(a.toString())<=new BigDecimal(t.toString())};false }
    private static Map mutation(def result,String id){ if(result?.errorCode=='VERSION_CONFLICT')return CommonFunctions.errorResponse('VERSION_CONFLICT','Объект изменён',[:],[],id); ok(result?:[:],id) }
    private static Map found(def value,String id){value?ok(value,id):CommonFunctions.errorResponse('NOT_FOUND','Объект не найден',[:],[],id)}
    private static Map ok(def value,String id){CommonFunctions.successResponse(value,id)}
    private static String requiredId(def v){String s=v?.toString()?.trim();if(!s||s.size()>200)throw new IllegalArgumentException('Идентификатор обязателен');s}
    private static String optionalId(def v){v==null||!v.toString().trim()?null:requiredId(v)}
    private static String text(def v,int max){String s=v?.toString()?.trim();if(!s||s.size()>max)throw new IllegalArgumentException('Недопустимый текст');s}
    private static int positive(def v,def fallback){if(v==null){if(fallback!=null)return fallback;throw new IllegalArgumentException('Ожидалось положительное число')};int n;try{n=Integer.parseInt(v.toString())}catch(Exception e){throw new IllegalArgumentException('Ожидалось положительное число')};if(n<1)throw new IllegalArgumentException('Ожидалось положительное число');n}
    private static long version(def v){if(v==null)throw new IllegalArgumentException('expectedVersion обязателен');long n;try{n=Long.parseLong(v.toString())}catch(Exception e){throw new IllegalArgumentException('Недопустимый expectedVersion')};if(n<0)throw new IllegalArgumentException('Недопустимый expectedVersion');n}
    private static List idList(def v,String name){if(!(v instanceof Collection)||v.size()>100)throw new IllegalArgumentException("${name} должен быть массивом");v.collect{requiredId(it)}.unique()}
    private static Date requiredDate(def v){try{return Date.from(java.time.OffsetDateTime.parse(v?.toString()).toInstant())}catch(Exception e){throw new IllegalArgumentException('Недопустимая дата')}}
}
