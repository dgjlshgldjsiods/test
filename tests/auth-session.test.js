import { AuthSession } from '../js/core/auth-session.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

QUnit.module('AuthSession', () => {
  QUnit.test('сохраняет только данные сессии и возвращает token/language', (assert) => {
    const session = new AuthSession({ storage: createMemoryStorage(), defaultLanguage: 'ru' });
    session.set({
      sessionToken: 'secret-token',
      expiresAt: '2030-01-01T00:00:00Z',
      user: { id: 'employee$1', language: 'en', password: 'must-not-be-stored' }
    });

    assert.strictEqual(session.getSessionToken(), 'secret-token');
    assert.strictEqual(session.getLanguage(), 'en');
    assert.false(session.isExpired(new Date('2029-01-01T00:00:00Z')));
    assert.notOk(Object.hasOwn(session.get().user, 'password'));
  });

  QUnit.test('очищает повреждённую сессию', (assert) => {
    const storage = createMemoryStorage();
    storage.setItem('itsm.session', '{bad-json');
    const session = new AuthSession({ storage });

    assert.strictEqual(session.get(), null);
    assert.strictEqual(storage.getItem('itsm.session'), null);
  });

  QUnit.test('clear удаляет сессию', (assert) => {
    const storage = createMemoryStorage();
    const session = new AuthSession({ storage });
    session.set({ sessionToken: 'token', expiresAt: '2030-01-01T00:00:00Z' });
    session.clear();
    assert.strictEqual(session.getSessionToken(), null);
  });
});
