import { FormsApi } from '../js/api/forms-api.js';
import { DataTable } from '../js/components/data-table.js';
import { Pagination } from '../js/components/pagination.js';

QUnit.module('FormsApi', () => {
  QUnit.test('formsGetList передаёт серверную пагинацию, фильтры и сортировку', async (assert) => {
    const calls = [];
    const api = new FormsApi({
      exec(name, body) { calls.push({ name, body }); return Promise.resolve({ items: [] }); }
    });
    const request = {
      page: 2, pageSize: 20,
      filters: { search: 'incident', statuses: ['PUBLISHED'] },
      sort: [{ field: 'updatedAt', direction: 'desc' }]
    };
    await api.getList(request);
    assert.deepEqual(calls, [{ name: 'formsGetList', body: request }]);
  });

  QUnit.test('formsGet и formsGetVersions используют согласованные контракты', async (assert) => {
    const calls = [];
    const api = new FormsApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({}); } });
    await api.get('form$1');
    await api.getVersions('form$1', { page: 3, pageSize: 10 });
    assert.deepEqual(calls, [
      { name: 'formsGet', body: { formId: 'form$1' } },
      { name: 'formsGetVersions', body: { page: 3, pageSize: 10, formId: 'form$1' } }
    ]);
  });

  QUnit.test('команды редактора передают expectedVersion и schema только в тело', async (assert) => {
    const calls = [];
    const api = new FormsApi({ exec(name, body) { calls.push({ name, body }); return Promise.resolve({}); } });
    const schema = { pages: [{ name: 'main' }] };
    await api.create({ code: 'FORM-1' }, schema);
    await api.getVersion('version$1');
    await api.createVersion('form$1', { sourceVersionId: 'version$1', expectedFormVersion: 3 });
    await api.cloneVersion('form$1', 'version$1', 3);
    await api.saveDraft('form$1', 'version$2', schema, 4);
    await api.publishVersion('form$1', 'version$2', 5);
    assert.deepEqual(calls, [
      { name: 'formsCreate', body: { form: { code: 'FORM-1' }, initialSchema: schema } },
      { name: 'formsGetVersion', body: { formVersionId: 'version$1' } },
      { name: 'formsCreateVersion', body: { formId: 'form$1', sourceVersionId: 'version$1', schema: null, expectedFormVersion: 3 } },
      { name: 'formsCloneVersion', body: { formId: 'form$1', sourceVersionId: 'version$1', expectedFormVersion: 3 } },
      { name: 'formsSaveDraft', body: { formId: 'form$1', formVersionId: 'version$2', schema, expectedVersion: 4 } },
      { name: 'formsPublishVersion', body: { formId: 'form$1', formVersionId: 'version$2', expectedVersion: 5 } }
    ]);
  });
});

QUnit.module('Forms list components', () => {
  const i18n = { t: (key, params) => key === 'pagination.total' ? 'Total: ' + params.total : key };

  QUnit.test('DataTable вызывает серверную сортировку через callback', async (assert) => {
    const container = document.createElement('div');
    let selectedSort = null;
    const table = new DataTable(container, {
      i18n,
      columns: [{ key: 'code', label: 'Code', sortable: true }],
      onSort: (field, direction) => { selectedSort = { field, direction }; }
    });
    table.render([{ code: 'FORM-1' }], [{ field: 'code', direction: 'asc' }]);
    container.querySelector('button').click();
    assert.deepEqual(selectedSort, { field: 'code', direction: 'desc' });
    assert.strictEqual(container.querySelector('tbody td').textContent, 'FORM-1');
  });

  QUnit.test('Pagination передаёт выбранную страницу через callback', (assert) => {
    const container = document.createElement('div');
    let selectedPage = null;
    const pagination = new Pagination(container, {
      i18n,
      onPageChange: (page) => { selectedPage = page; }
    });
    pagination.render({ page: 2, totalPages: 4, total: 72 });
    const pageThree = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === '3');
    pageThree.click();
    assert.strictEqual(selectedPage, 3);
    assert.ok(container.textContent.includes('Total: 72'));
  });
});
