/**
 * Smoke test for WO-3 ApiClient (token header, ErrorResponse parse, 401 signal).
 * Run: npm run smoke:wo3
 */
import { ApiClient } from '../src/api/client';
import { ApiError } from '../src/types/api';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function main(): Promise<void> {
  let unauthorized = 0;
  let lastAuth: string | null = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    lastAuth = new Headers(init?.headers).get('Authorization');

    if (url.endsWith('/ok')) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.endsWith('/fail')) {
      return new Response(
        JSON.stringify({
          message: 'Title is required',
          code: 'VALIDATION_ERROR',
          errors: [{ field: 'title', message: 'title is required' }],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.endsWith('/gone')) {
      return new Response(JSON.stringify({ message: 'Session expired', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('missing', { status: 404 });
  }) as typeof fetch;

  try {
    const api = new ApiClient({
      baseUrl: 'http://example.test',
      getToken: () => 'tok-123',
      onUnauthorized: () => {
        unauthorized += 1;
      },
    });

    const ok = await api.get<{ ok: boolean }>('/ok');
    assert(ok.ok === true, 'parses JSON success body');
    assert(lastAuth === 'Bearer tok-123', 'attaches bearer token');

    let validation: ApiError | null = null;
    try {
      await api.post('/fail', { title: '' });
    } catch (error) {
      validation = error instanceof ApiError ? error : null;
    }
    assert(validation?.status === 400, 'maps HTTP status');
    assert(validation?.code === 'VALIDATION_ERROR', 'parses ErrorResponse code');
    assert(validation?.message === 'Title is required', 'surfaces server message');
    assert(validation?.errors?.[0]?.field === 'title', 'keeps field errors');

    let unauthorizedError = false;
    try {
      await api.get('/gone');
    } catch (error) {
      unauthorizedError = error instanceof ApiError && error.status === 401;
    }
    assert(unauthorizedError, 'throws on 401');
    assert(unauthorized === 1, 'signals invalid session once');

    await api.post('/ok', { a: 1 }, { auth: false });
    assert(lastAuth === null, 'can omit bearer token');

    console.log('WO-3 smoke test PASSED');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error('WO-3 smoke test FAILED');
  console.error(error);
  process.exit(1);
});
