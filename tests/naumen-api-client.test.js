import { NaumenApiClient, NaumenApiError } from '../js/api/naumen-api-client.js';

const config = {
  baseUrl: 'https://naumen.example.test/root/',
  accessKey: 'technical key&value',
  moduleName: 'modules.newItsmTest',
  requestTimeout: 100,
  defaultLanguage: 'ru',
  debug: false
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function createSessionProvider() {
  return {
    cleared: 0,
    getSessionToken: () => 'user-session-token',
    getLanguage: () => 'en',
    clear() { this.cleared += 1; }
  };
}

QUnit.module('NaumenApiClient', (hooks) => {
  let originalFetch;
  hooks.beforeEach(() => { originalFetch = globalThis.fetch; });
  hooks.afterEach(() => { globalThis.fetch = originalFetch; });

  QUnit.test('строит и кодирует только технические query-параметры', (assert) => {
    const client = new NaumenApiClient(config, createSessionProvider());
    const url = new URL(client.buildExecUrl('auth Login/тест'));

    assert.strictEqual(url.pathname, '/root/services/rest/exec-post');
    assert.strictEqual(url.searchParams.get('accessKey'), 'technical key&value');
    assert.strictEqual(url.searchParams.get('func'), 'modules.newItsmTest.auth Login/тест');
    assert.strictEqual(url.searchParams.get('params'), 'requestContent,user');
    assert.deepEqual(Array.from(url.searchParams.keys()).sort(), ['accessKey', 'func', 'params']);
  });

  QUnit.test('POST добавляет requestId, header, sessionToken и язык только в JSON', async (assert) => {
    const session = createSessionProvider();
    const client = new NaumenApiClient(config, session);
    let captured;
    globalThis.fetch = async (url, options) => {
      captured = { url, options };
      return jsonResponse({ success: true, data: { ok: true } });
    };

    const result = await client.exec('requestsGetList', { search: 'secret business value' });
    const url = new URL(captured.url);
    const body = JSON.parse(captured.options.body);

    assert.deepEqual(result, { ok: true });
    assert.strictEqual(captured.options.method, 'POST');
    assert.strictEqual(url.searchParams.get('search'), null);
    assert.notOk(captured.url.includes('secret%20business') || captured.url.includes('secret+business'));
    assert.ok(body.requestId);
    assert.strictEqual(captured.options.headers['X-Request-ID'], body.requestId);
    assert.strictEqual(body.sessionToken, 'user-session-token');
    assert.strictEqual(body.language, 'en');
    assert.strictEqual(body.search, 'secret business value');
  });

  QUnit.test('auth:false не добавляет sessionToken', async (assert) => {
    const client = new NaumenApiClient(config, createSessionProvider());
    let body;
    globalThis.fetch = async (_url, options) => {
      body = JSON.parse(options.body);
      return jsonResponse({ success: true, data: {} });
    };

    await client.exec('authLogin', { login: 'ivanov', password: 'password' }, { auth: false });
    assert.notOk(Object.hasOwn(body, 'sessionToken'));
    assert.ok(body.requestId);
  });

  QUnit.test('создаёт бизнес-ошибку при HTTP 200', async (assert) => {
    const client = new NaumenApiClient(config, createSessionProvider());
    globalThis.fetch = async () => jsonResponse({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid', fieldErrors: { title: 'Required' } }
    });

    await assert.rejects(client.exec('test'), (error) => {
      return error instanceof NaumenApiError
        && error.kind === 'business'
        && error.code === 'VALIDATION_ERROR'
        && error.fieldErrors.title === 'Required';
    });
  });

  QUnit.test('обрабатывает пустой и некорректный JSON', async (assert) => {
    const client = new NaumenApiClient(config, createSessionProvider());
    globalThis.fetch = async () => new Response('', { status: 200 });
    await assert.rejects(client.exec('empty'), (error) => error.code === 'EMPTY_RESPONSE');

    globalThis.fetch = async () => new Response('{bad', { status: 200 });
    await assert.rejects(client.exec('invalid'), (error) => error.code === 'INVALID_JSON_RESPONSE');
  });

  QUnit.test('обрабатывает HTTP-ошибку', async (assert) => {
    const client = new NaumenApiClient(config, createSessionProvider());
    globalThis.fetch = async () => jsonResponse({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } }, 403);
    await assert.rejects(client.exec('protected'), (error) => error.kind === 'http' && error.status === 403 && error.code === 'FORBIDDEN');
  });

  QUnit.test('timeout отменяет запрос', async (assert) => {
    const client = new NaumenApiClient(config, createSessionProvider());
    globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
    await assert.rejects(client.exec('slow', {}, { timeout: 5 }), (error) => error.code === 'TIMEOUT' && error.kind === 'timeout');
  });

  QUnit.test('очищает сессию при INVALID_SESSION и SESSION_EXPIRED', async (assert) => {
    const session = createSessionProvider();
    const client = new NaumenApiClient(config, session);
    for (const code of ['INVALID_SESSION', 'SESSION_EXPIRED']) {
      globalThis.fetch = async () => jsonResponse({ success: false, error: { code, message: code } });
      await assert.rejects(client.exec('protected'), (error) => error.code === code);
    }
    assert.strictEqual(session.cleared, 2);
  });

  QUnit.test('очищает сессию при HTTP 401', async (assert) => {
    const session = createSessionProvider();
    const client = new NaumenApiClient(config, session);
    globalThis.fetch = async () => jsonResponse({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    await assert.rejects(client.exec('protected'), (error) => error.status === 401);
    assert.strictEqual(session.cleared, 1);
  });
});
