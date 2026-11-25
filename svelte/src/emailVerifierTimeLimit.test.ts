/**
 * The email check gives the external verifier a time limit: a request that stalls, before its
 * headers or while its body arrives, ends at the limit and takes the existing error path, so the
 * auth screen shows its error state instead of waiting. `AbortSignal.timeout` runs on Node's
 * internal timers, which fake timers do not reach, so the test records the limit the check asks for
 * and hands it a signal it aborts itself once the request is waiting.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActionCtx } from './convex/_generated/server';
import validateEmail, { EMAIL_VERIFIER_TIME_LIMIT_MS } from './convex/model/emails/validateEmail';

type Stall = 'before its headers' | 'while its body arrives';

/** A verifier stand-in that stalls at `stall` and ends only when its signal aborts, as `fetch` does. */
function stalledVerifier(stall: Stall, timeLimit: AbortController) {
	return vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
		const signal = init?.signal;
		if (!signal) throw new Error('the verifier request carries no time limit');
		const aborted = new Promise<never>((_resolve, reject) => {
			signal.addEventListener('abort', () => reject(signal.reason), { once: true });
		});
		// The check is waiting on this request (or its body) by the time this timer runs.
		setTimeout(() => timeLimit.abort(new DOMException('The operation timed out.', 'TimeoutError')));
		if (stall === 'before its headers') return await aborted;
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				aborted.catch((reason: unknown) => controller.error(reason));
			}
		});
		return new Response(body, { headers: { 'Content-Type': 'application/json' } });
	});
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

describe.each(['before its headers', 'while its body arrives'] as const)(
	'the email check when the verifier stalls %s',
	(stall) => {
		it('gives up at its time limit and reports the verification error', async () => {
			vi.stubEnv('REOON_EMAIL_VERIFIER_TOKEN', 'test-token');
			const timeLimit = new AbortController();
			const limit = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeLimit.signal);
			const verifier = stalledVerifier(stall, timeLimit);
			vi.stubGlobal('fetch', verifier);
			vi.spyOn(console, 'error').mockImplementation(() => {});

			const result = await validateEmail({} as ActionCtx, 'person@example.org');

			expect(limit).toHaveBeenCalledWith(EMAIL_VERIFIER_TIME_LIMIT_MS);
			expect(verifier).toHaveBeenCalledOnce();
			expect(verifier.mock.calls[0][1]?.signal).toBe(timeLimit.signal);
			expect(result).toEqual({
				valid: false,
				email: 'person@example.org',
				reason: 'Error processing email verification'
			});
		});
	}
);
