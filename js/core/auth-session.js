const DEFAULT_STORAGE_KEY = 'itsm.session';

export class AuthSession {
  constructor(options = {}) {
    this.storage = options.storage || globalThis.localStorage;
    this.storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    this.defaultLanguage = options.defaultLanguage || 'ru';
  }

  set(session) {
    if (!session?.sessionToken || !session?.expiresAt) {
      throw new TypeError('Session must contain sessionToken and expiresAt');
    }

    const expiresAt = new Date(session.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new TypeError('Session expiresAt must be a valid ISO date');
    }

    const safeSession = {
      sessionToken: String(session.sessionToken),
      expiresAt: expiresAt.toISOString(),
      user: sanitizeUser(session.user),
      language: session.language || session.user?.language || this.defaultLanguage
    };

    this.storage.setItem(this.storageKey, JSON.stringify(safeSession));
    return safeSession;
  }

  get() {
    const rawValue = this.storage.getItem(this.storageKey);
    if (!rawValue) return null;

    try {
      const session = JSON.parse(rawValue);
      if (!session?.sessionToken || !session?.expiresAt) {
        this.clear();
        return null;
      }
      return session;
    } catch {
      this.clear();
      return null;
    }
  }

  getSessionToken() {
    const session = this.get();
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.clear();
      return null;
    }
    return session.sessionToken;
  }

  getLanguage() {
    return this.get()?.language || this.defaultLanguage;
  }

  isExpired(now = new Date()) {
    const session = this.get();
    if (!session) return true;
    return new Date(session.expiresAt).getTime() <= now.getTime();
  }

  clear() {
    this.storage.removeItem(this.storageKey);
  }
}

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const safeUser = {};
  for (const key of ['id', 'login', 'title', 'roles', 'language', 'timezone']) {
    if (user[key] !== undefined) safeUser[key] = user[key];
  }
  return safeUser;
}
