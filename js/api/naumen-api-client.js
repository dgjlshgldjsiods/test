import { createRequestId } from '../core/request-id.js';

const SESSION_ERROR_CODES = new Set(['SESSION_EXPIRED', 'INVALID_SESSION']);

export class NaumenApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'NaumenApiError';
    this.code = options.code || 'UNKNOWN_ERROR';
    this.kind = options.kind || 'transport';
    this.status = options.status ?? null;
    this.requestId = options.requestId || null;
    this.fieldErrors = options.fieldErrors || {};
    this.details = options.details || [];
    this.cause = options.cause;
  }
}

export class NaumenApiClient {
  constructor(config, sessionProvider, options = {}) {
    this.config = validateConfig(config);
    this.baseUrl = this.config.baseUrl.replace(/\/+$/, '');
    this.accessKey = this.config.accessKey;
    this.moduleName = this.config.moduleName;
    this.requestTimeout = this.config.requestTimeout || 30000;
    this.debug = Boolean(this.config.debug);
    this.sessionProvider = sessionProvider || null;
    this.onSessionInvalid = typeof options.onSessionInvalid === 'function'
      ? options.onSessionInvalid
      : null;
  }

  buildExecUrl(functionName) {
    if (typeof functionName !== 'string' || !functionName.trim()) {
      throw new TypeError('functionName must be a non-empty string');
    }

    const query = new URLSearchParams({
      accessKey: this.accessKey,
      func: this.moduleName + '.' + functionName.trim(),
      params: 'requestContent,user'
    });

    return this.baseUrl + '/services/rest/exec-post?' + query.toString();
  }

  async exec(functionName, requestContent = {}, options = {}) {
    if (!isPlainObject(requestContent)) {
      throw new TypeError('requestContent must be a plain object');
    }

    const requestId = createRequestId();
    const controller = new AbortController();
    const externalSignal = options.signal || null;
    const timeout = normalizeTimeout(options.timeout, this.requestTimeout);
    let timedOut = false;

    const payload = { ...requestContent, requestId };
    if (options.auth !== false) {
      const sessionToken = this.sessionProvider?.getSessionToken?.();
      if (sessionToken) payload.sessionToken = sessionToken;
    }
    if (options.includeLanguage !== false) {
      payload.language = this.sessionProvider?.getLanguage?.()
        || this.config.defaultLanguage
        || 'ru';
    }

    const abortFromExternalSignal = () => controller.abort(externalSignal.reason);
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort(externalSignal.reason);
      else externalSignal.addEventListener('abort', abortFromExternalSignal, { once: true });
    }

    const timeoutId = globalThis.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(this.buildExecUrl(functionName), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      let responseBody = null;
      let protocolError = null;
      try {
        responseBody = await this.readResponseBody(response, requestId);
      } catch (error) {
        protocolError = error;
      }

      if (!response.ok) {
        if (response.status === 401) this.invalidateSession();
        throw this.createHttpError(response.status, responseBody, requestId, protocolError);
      }

      if (protocolError) throw protocolError;

      if (responseBody.success !== true) {
        const businessError = this.createBusinessError(responseBody, requestId);
        if (SESSION_ERROR_CODES.has(businessError.code)) this.invalidateSession();
        throw businessError;
      }

      return responseBody.data;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new NaumenApiError(
          timedOut ? 'Время ожидания ответа истекло' : 'Запрос отменён',
          {
            code: timedOut ? 'TIMEOUT' : 'REQUEST_ABORTED',
            kind: timedOut ? 'timeout' : 'abort',
            requestId,
            cause: error
          }
        );
      }
      this.safeDebugLog(functionName, requestId, error);
      throw error;
    } finally {
      globalThis.clearTimeout(timeoutId);
      externalSignal?.removeEventListener?.('abort', abortFromExternalSignal);
    }
  }

  async readResponseBody(response, requestId) {
    const text = await response.text();
    if (!text.trim()) {
      throw new NaumenApiError('Сервер вернул пустой ответ', {
        code: 'EMPTY_RESPONSE', kind: 'protocol', status: response.status, requestId
      });
    }

    try {
      const body = JSON.parse(text);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Expected object');
      return body;
    } catch (cause) {
      throw new NaumenApiError('Сервер вернул некорректный JSON', {
        code: 'INVALID_JSON_RESPONSE', kind: 'protocol', status: response.status, requestId, cause
      });
    }
  }

  createHttpError(status, responseBody, requestId, cause) {
    const error = responseBody?.error;
    return new NaumenApiError(error?.message || 'Ошибка HTTP ' + status, {
      code: error?.code || 'HTTP_ERROR',
      kind: 'http',
      status,
      requestId,
      fieldErrors: error?.fieldErrors,
      details: error?.details,
      cause
    });
  }

  createBusinessError(responseBody, requestId) {
    const error = responseBody?.error || {};
    return new NaumenApiError(error.message || 'Сервер отклонил операцию', {
      code: error.code || 'BUSINESS_ERROR',
      kind: 'business',
      requestId: responseBody?.requestId || requestId,
      fieldErrors: error.fieldErrors,
      details: error.details
    });
  }

  invalidateSession() {
    this.sessionProvider?.clear?.();
    this.onSessionInvalid?.();
  }

  safeDebugLog(functionName, requestId, error) {
    if (!this.debug || !globalThis.console?.debug) return;
    console.debug('Naumen request failed', {
      functionName,
      requestId,
      code: error?.code || error?.name || 'UNKNOWN_ERROR'
    });
  }
}

function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new TypeError('config is required');
  for (const key of ['baseUrl', 'accessKey', 'moduleName']) {
    if (typeof config[key] !== 'string' || !config[key].trim()) {
      throw new TypeError('config.' + key + ' must be a non-empty string');
    }
  }
  return config;
}

function normalizeTimeout(value, fallback) {
  const timeout = value ?? fallback;
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new TypeError('timeout must be a positive finite number');
  }
  return timeout;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
