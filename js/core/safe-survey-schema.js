const QUESTION_TYPES = new Set([
  'text', 'comment', 'checkbox', 'radiogroup', 'dropdown', 'tagbox',
  'boolean', 'rating', 'ranking', 'multipletext', 'matrix',
  'matrixdropdown', 'matrixdynamic', 'paneldynamic', 'expression'
]);
const CONTAINER_TYPES = new Set(['panel']);
const VALIDATOR_TYPES = new Set(['numeric', 'text', 'email', 'regex', 'expression', 'answercount']);
export const SURVEY_DICTIONARY_CODES = Object.freeze([
  'REQUEST_USERS', 'REQUEST_GROUPS', 'REQUEST_DEPARTMENTS', 'REQUEST_ORGANIZATIONS'
]);
const DICTIONARY_CODES = new Set(SURVEY_DICTIONARY_CODES);
const EXPRESSION_KEYS = new Set(['visibleIf', 'enableIf', 'requiredIf', 'expression', 'setValueIf']);
const FORBIDDEN_KEYS = new Set([
  'choicesByUrl', 'url', 'href', 'html', 'onComplete', 'onValueChanged',
  'onAfterRenderQuestion', 'onAfterRenderSurvey', 'script'
]);

export class SurveySchemaError extends Error {
  constructor(code, path) { super(code + ' at ' + path); this.name = 'SurveySchemaError'; this.code = code; this.path = path; }
}

export function validateAndCloneSurveySchema(schema) {
  if (!isPlainObject(schema)) throw new SurveySchemaError('SCHEMA_OBJECT_REQUIRED', '$');
  assertJsonValue(schema, '$', 0, new Set());
  const clone = cloneJson(schema);
  walk(clone, '$', 0);
  return clone;
}

function assertJsonValue(value, path, depth, visited) {
  if (depth > 24) throw new SurveySchemaError('SCHEMA_TOO_DEEP', path);
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return;
  if (typeof value !== 'object') throw new SurveySchemaError('SCHEMA_NOT_JSON', path);
  if (visited.has(value)) throw new SurveySchemaError('SCHEMA_NOT_JSON', path);
  visited.add(value);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new SurveySchemaError('SCHEMA_OBJECT_INVALID', path);
  Object.entries(value).forEach(([key, child]) => assertJsonValue(child, `${path}.${key}`, depth + 1, visited));
  visited.delete(value);
}

export function collectDictionaryQuestions(schema) {
  const result = [];
  visitElements(schema?.pages || [], result);
  visitElements(schema?.elements || [], result);
  return result;
}

function visitElements(elements, result) {
  if (!Array.isArray(elements)) return;
  elements.forEach((element) => {
    if (!isPlainObject(element)) return;
    if (element.dictionaryCode) result.push({ name: element.name, dictionaryCode: element.dictionaryCode });
    visitElements(element.elements, result);
    visitElements(element.templateElements, result);
  });
}

function walk(value, path, depth) {
  if (depth > 24) throw new SurveySchemaError('SCHEMA_TOO_DEEP', path);
  if (Array.isArray(value)) {
    if (value.length > 1000) throw new SurveySchemaError('SCHEMA_ARRAY_TOO_LARGE', path);
    value.forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (!isPlainObject(value)) {
    if (typeof value === 'string' && /(?:https?:|javascript:|data:|<script|<iframe)/i.test(value)) {
      throw new SurveySchemaError('EXTERNAL_OR_ACTIVE_CONTENT_FORBIDDEN', path);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(key) || /^on[A-Z]/.test(key)) throw new SurveySchemaError('FORBIDDEN_PROPERTY', childPath);
    if (key === 'type' && path !== '$' && typeof child === 'string'
      && !QUESTION_TYPES.has(child) && !CONTAINER_TYPES.has(child) && !VALIDATOR_TYPES.has(child)) {
      throw new SurveySchemaError('QUESTION_TYPE_FORBIDDEN', childPath);
    }
    if (key === 'dictionaryCode' && !DICTIONARY_CODES.has(child)) throw new SurveySchemaError('DICTIONARY_FORBIDDEN', childPath);
    if (EXPRESSION_KEYS.has(key) && child != null) validateExpression(child, childPath);
    walk(child, childPath, depth + 1);
  }
}

function validateExpression(value, path) {
  if (typeof value !== 'string' || value.length > 500) throw new SurveySchemaError('EXPRESSION_INVALID', path);
  if (/[`;()[\]]|\b(?:function|window|document|globalThis|eval|constructor|prototype|fetch|XMLHttpRequest)\b/i.test(value)) {
    throw new SurveySchemaError('EXPRESSION_FORBIDDEN', path);
  }
  if (!/^[\s\w{}.'"+\-*/%<>=!&|?:,]+$/.test(value)) throw new SurveySchemaError('EXPRESSION_INVALID', path);
}

function cloneJson(value) {
  try { return JSON.parse(JSON.stringify(value)); }
  catch { throw new SurveySchemaError('SCHEMA_NOT_JSON', '$'); }
}
function isPlainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
