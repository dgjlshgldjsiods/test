import {
  collectDictionaryQuestions, SurveySchemaError, validateAndCloneSurveySchema
} from '../js/core/safe-survey-schema.js';

QUnit.module('Safe SurveyJS schema', () => {
  QUnit.test('allows declarative visibility, required and simple calculated expressions', (assert) => {
    const schema = { pages: [{ name: 'main', elements: [
      { type: 'text', name: 'quantity', isRequired: true },
      { type: 'text', name: 'price', visibleIf: '{quantity} > 0', requiredIf: '{quantity} > 1' },
      { type: 'expression', name: 'total', expression: '{quantity} * {price}' }
    ] }] };
    assert.deepEqual(validateAndCloneSurveySchema(schema), schema);
  });

  QUnit.test('rejects arbitrary JavaScript, event properties and external URLs', (assert) => {
    assert.throws(() => validateAndCloneSurveySchema({ elements: [{ type: 'expression', name: 'x', expression: 'window["network"]("https://evil")' }] }), SurveySchemaError);
    assert.throws(() => validateAndCloneSurveySchema({ elements: [{ type: 'text', name: 'x', handler() {} }] }), /SCHEMA_NOT_JSON/);
    assert.throws(() => validateAndCloneSurveySchema({ elements: [{ type: 'text', name: 'x', onValueChanged: 'alert(1)' }] }), /FORBIDDEN_PROPERTY/);
    assert.throws(() => validateAndCloneSurveySchema({ elements: [{ type: 'dropdown', name: 'x', choicesByUrl: { url: 'https://evil' } }] }), /FORBIDDEN_PROPERTY/);
  });

  QUnit.test('accepts only project allowlisted REST dictionaries', (assert) => {
    const schema = { elements: [{ type: 'dropdown', name: 'requestedFor', dictionaryCode: 'REQUEST_USERS' }] };
    const safe = validateAndCloneSurveySchema(schema);
    assert.deepEqual(collectDictionaryQuestions(safe), [{ name: 'requestedFor', dictionaryCode: 'REQUEST_USERS' }]);
    assert.throws(() => validateAndCloneSurveySchema({ elements: [{ type: 'dropdown', name: 'x', dictionaryCode: 'https://evil' }] }), /DICTIONARY_FORBIDDEN/);
  });

  QUnit.test('rejects unsupported custom question types', (assert) => {
    assert.throws(() => validateAndCloneSurveySchema({ elements: [{ type: 'custom-widget', name: 'x' }] }), /QUESTION_TYPE_FORBIDDEN/);
  });
});
