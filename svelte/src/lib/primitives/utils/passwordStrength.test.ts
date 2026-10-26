import { describe, expect, it, vi } from 'vitest';
import {
	CHECKING_STRENGTH_MESSAGE,
	TOO_WEAK_MESSAGE,
	createPasswordCheckerLoader,
	passwordValidityMessage,
	type PasswordChecker
} from './passwordStrength';

const WEAK = 'password1';
const STRONG = 'vatnajokull-ostrich-cobalt-91';

const loadRealChecker = () =>
	createPasswordCheckerLoader(() =>
		import('./passwordChecker').then((module) => module.passwordChecker)
	).load();

describe('passwordValidityMessage', () => {
	it('keeps a password invalid while the checker loads', () => {
		expect(passwordValidityMessage(WEAK, 3, null)).toBe(CHECKING_STRENGTH_MESSAGE);
		expect(passwordValidityMessage(STRONG, 3, null)).toBe(CHECKING_STRENGTH_MESSAGE);
	});

	it('rejects a weak password once the checker has loaded', async () => {
		const checker = await loadRealChecker();
		expect(passwordValidityMessage(WEAK, 3, checker.check(WEAK).score)).toBe(TOO_WEAK_MESSAGE);
	});

	it('accepts a strong password once the checker has loaded', async () => {
		const checker = await loadRealChecker();
		expect(checker.check(STRONG).score).toBe(4);
		expect(passwordValidityMessage(STRONG, 3, checker.check(STRONG).score)).toBe('');
	});

	it('never blocks a field with minScore 0', () => {
		expect(passwordValidityMessage(WEAK, 0, null)).toBe('');
		expect(passwordValidityMessage(WEAK, 0, 0)).toBe('');
	});

	it('leaves an empty password to the required attribute', () => {
		expect(passwordValidityMessage('', 3, null)).toBe('');
		expect(passwordValidityMessage('', 3, 0)).toBe('');
	});
});

describe('createPasswordCheckerLoader', () => {
	const checker: PasswordChecker = {
		check: () => ({ score: 4 }) as ReturnType<PasswordChecker['check']>
	};

	it('imports the checker once and shares it', async () => {
		const importChecker = vi.fn(() => Promise.resolve(checker));
		const loader = createPasswordCheckerLoader(importChecker);
		expect(loader.loaded()).toBeNull();

		const [first, second] = await Promise.all([loader.load(), loader.load()]);
		await loader.load();

		expect(importChecker).toHaveBeenCalledTimes(1);
		expect(first).toBe(checker);
		expect(second).toBe(checker);
		expect(loader.loaded()).toBe(checker);
	});

	it('tries again after a failed import', async () => {
		const importChecker = vi
			.fn<() => Promise<PasswordChecker>>()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(checker);
		const loader = createPasswordCheckerLoader(importChecker);

		await expect(loader.load()).rejects.toThrow('offline');
		expect(loader.loaded()).toBeNull();
		await expect(loader.load()).resolves.toBe(checker);
		expect(importChecker).toHaveBeenCalledTimes(2);
	});
});
