import { collectDictionaryQuestions, SURVEY_DICTIONARY_CODES } from '../core/safe-survey-schema.js';

const ALLOWED = new Set(SURVEY_DICTIONARY_CODES);

export class SurveyDictionaryLoader {
  constructor(dictionariesApi) { this.dictionariesApi = dictionariesApi; }

  async hydrate(model, schema) {
    const definitions = collectDictionaryQuestions(schema);
    await Promise.all(definitions.map(async ({ name, dictionaryCode }) => {
      if (!name || !ALLOWED.has(dictionaryCode)) throw new Error('DICTIONARY_FORBIDDEN');
      const result = await this.dictionariesApi.getSurveyItems(dictionaryCode, { page: 1, pageSize: 100, search: '' });
      const question = model.getQuestionByName(name);
      if (!question) return;
      question.choices = (result?.items || []).map((item) => ({ value: item.id, text: label(item) }));
    }));
  }
}

function label(item) {
  const value = item?.title || item?.name;
  if (typeof value === 'string') return value;
  const language = globalThis.document?.documentElement?.lang || 'ru';
  return value?.[language] || value?.ru || value?.en || item?.id || '—';
}
