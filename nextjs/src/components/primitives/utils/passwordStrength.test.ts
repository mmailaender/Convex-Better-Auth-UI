import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import {
	CHECKING_STRENGTH_MESSAGE,
	TOO_WEAK_MESSAGE,
	createPasswordCheckerLoader,
	passwordStrengthText,
	passwordValidityMessage,
	type PasswordChecker
} from './passwordStrength.ts';

const WEAK = 'password1';
const STRONG = 'vatnajokull-ostrich-cobalt-91';

const loadRealChecker = () =>
	createPasswordCheckerLoader(() =>
		import('./passwordChecker.ts').then((module) => module.passwordChecker)
	).load();

describe('passwordValidityMessage', () => {
	it('keeps a password invalid while the checker loads', () => {
		assert.equal(passwordValidityMessage(WEAK, 3, null), CHECKING_STRENGTH_MESSAGE);
		assert.equal(passwordValidityMessage(STRONG, 3, null), CHECKING_STRENGTH_MESSAGE);
	});

	it('rejects a weak password once the checker has loaded', async () => {
		const checker = await loadRealChecker();
		assert.equal(passwordValidityMessage(WEAK, 3, checker.check(WEAK).score), TOO_WEAK_MESSAGE);
	});

	it('accepts a strong password once the checker has loaded', async () => {
		const checker = await loadRealChecker();
		assert.equal(checker.check(STRONG).score, 4);
		assert.equal(passwordValidityMessage(STRONG, 3, checker.check(STRONG).score), '');
	});

	it('never blocks a field with minScore 0', () => {
		assert.equal(passwordValidityMessage(WEAK, 0, null), '');
		assert.equal(passwordValidityMessage(WEAK, 0, 0), '');
	});

	it('leaves an empty password to the required attribute', () => {
		assert.equal(passwordValidityMessage('', 3, null), '');
		assert.equal(passwordValidityMessage('', 3, 0), '');
	});
});

describe('createPasswordCheckerLoader', () => {
	const checker: PasswordChecker = {
		check: () => ({ score: 4 }) as ReturnType<PasswordChecker['check']>
	};

	it('imports the checker once and shares it', async () => {
		const importChecker = mock.fn(() => Promise.resolve(checker));
		const loader = createPasswordCheckerLoader(importChecker);
		assert.equal(loader.loaded(), null);

		const [first, second] = await Promise.all([loader.load(), loader.load()]);
		await loader.load();

		assert.equal(importChecker.mock.callCount(), 1);
		assert.equal(first, checker);
		assert.equal(second, checker);
		assert.equal(loader.loaded(), checker);
	});

	it('tries again after a failed import', async () => {
		let calls = 0;
		const loader = createPasswordCheckerLoader(() =>
			++calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(checker)
		);

		await assert.rejects(loader.load(), /offline/);
		assert.equal(loader.loaded(), null);
		assert.equal(await loader.load(), checker);
		assert.equal(calls, 2);
	});
});

describe('passwordStrengthText', () => {
	it('names each score in the words of its colour', () => {
		assert.equal(passwordStrengthText(WEAK, 0), 'Weak');
		assert.equal(passwordStrengthText(WEAK, 1), 'Weak');
		assert.equal(passwordStrengthText(WEAK, 2), 'Fair');
		assert.equal(passwordStrengthText(WEAK, 3), 'Good');
		assert.equal(passwordStrengthText(STRONG, 4), 'Strong');
	});

	it('says nothing while the password is empty or the checker loads', () => {
		assert.equal(passwordStrengthText('', 0), undefined);
		assert.equal(passwordStrengthText(STRONG, null), undefined);
	});
});
