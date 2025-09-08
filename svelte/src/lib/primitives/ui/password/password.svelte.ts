import { Context, watch } from 'runed';
import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

const passwordOptions = {
	translations: zxcvbnEnPackage.translations,
	graphs: zxcvbnCommonPackage.adjacencyGraphs,
	dictionary: {
		...zxcvbnCommonPackage.dictionary,
		...zxcvbnEnPackage.dictionary
	}
};

zxcvbnOptions.setOptions(passwordOptions);

type PasswordRootStateProps = WritableBoxedValues<{
	hidden: boolean;
}> &
	ReadableBoxedValues<{
		minScore: number;
	}>;

type PasswordState = {
	value: string;
	copyMounted: boolean;
	toggleMounted: boolean;
	strengthMounted: boolean;
	submitted: boolean;
	inputRef: HTMLInputElement | null;
};

const defaultPasswordState: PasswordState = {
	value: '',
	copyMounted: false,
	toggleMounted: false,
	strengthMounted: false,
	submitted: false,
	inputRef: null
};

class PasswordRootState {
	passwordState = $state(defaultPasswordState);

	constructor(readonly opts: PasswordRootStateProps) {}

	// only re-run when the password changes
	strength = $derived.by(() => zxcvbn(this.passwordState.value));
}

type PasswordInputStateProps = WritableBoxedValues<{
	value: string;
}> &
	ReadableBoxedValues<{
		ref: HTMLInputElement | null;
	}>;

class PasswordInputState {
	constructor(
		readonly root: PasswordRootState,
		readonly opts: PasswordInputStateProps
	) {
		watch(
			() => this.opts.value.current,
			() => {
				if (this.root.passwordState.value !== this.opts.value.current) {
					this.root.passwordState.value = this.opts.value.current;
					// Clear submitted state once the user starts typing again after a submit
					if (this.root.passwordState.submitted) {
						this.root.passwordState.submitted = false;
					}
				}
			}
		);

		$effect(() => {
			if (!this.root.passwordState.strengthMounted) return;

			// if the password is empty, we let the `required` attribute handle the validation
			if (
				this.root.passwordState.value !== '' &&
				this.root.strength.score < this.root.opts.minScore.current
			) {
				this.opts.ref.current?.setCustomValidity('Password is too weak');
			} else {
				this.opts.ref.current?.setCustomValidity('');
			}
		});

		// Track the input element on the root so other primitives (e.g. Error) can read validity
		$effect(() => {
			this.root.passwordState.inputRef = this.opts.ref.current;
			return () => {
				if (this.root.passwordState.inputRef === this.opts.ref.current) {
					this.root.passwordState.inputRef = null;
				}
			};
		});

		// Listen to form submission to toggle submitted state reactively
		$effect(() => {
			const form = this.root.passwordState.inputRef?.form as HTMLFormElement | null;
			if (!form) return;
			const onSubmit = () => {
				this.root.passwordState.submitted = true;
			};
			form.addEventListener('submit', onSubmit, { capture: true });
			const onInvalid = (e: Event) => {
				e.preventDefault();
				this.root.passwordState.submitted = true;
			};
			form.addEventListener('invalid', onInvalid, { capture: true } as AddEventListenerOptions);

			return () => {
				form.removeEventListener('submit', onSubmit, { capture: true } as any);
				form.removeEventListener('invalid', onInvalid, { capture: true } as any);
			};
		});
	}

	props = $derived.by(() => {
		const input = this.root.passwordState.inputRef;
		let invalid = false;
		if (input) {
			const submitted = this.root.passwordState.submitted;
			invalid = submitted && !input.validity.valid;
		}
		return {
			'aria-invalid': invalid ? true : undefined
		};
	});
}

class PasswordToggleVisibilityState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.toggleMounted = true;

		// this way we go back to the correct padding when toggle is unmounted
		$effect(() => {
			return () => {
				this.root.passwordState.toggleMounted = false;
			};
		});
	}
}

class PasswordCopyState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.copyMounted = true;

		// this way we go back to the correct padding when copy is unmounted
		$effect(() => {
			return () => {
				this.root.passwordState.copyMounted = false;
			};
		});
	}
}

class PasswordStrengthState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.strengthMounted = true;

		$effect(() => {
			return () => {
				this.root.passwordState.strengthMounted = false;
			};
		});
	}

	get strength() {
		return this.root.strength;
	}
}

class PasswordErrorState {
	constructor(readonly root: PasswordRootState) {}

	// Message derived from the input's current validity. Does not trigger native UI.
	message = $derived.by(() => {
		const input = this.root.passwordState.inputRef;
		if (!input) return null as string | null;

		// Only show errors after the form has been submitted
		const submitted = this.root.passwordState.submitted;
		if (!submitted) return null as string | null;

		// If invalid, craft a stable message without relying solely on validationMessage
		if (!input.validity.valid) {
			const v = input.validity;
			if (v.valueMissing) return 'Please fill out this field.';
			// For other cases (pattern, tooShort, etc.) keep native/custom message fallback
			return input.validationMessage || 'Invalid value';
		}

		return null as string | null;
	});

	get inputEl() {
		return this.root.passwordState.inputRef;
	}
}

const ctx = new Context<PasswordRootState>('password-root-state');

export function usePassword(props: PasswordRootStateProps) {
	return ctx.set(new PasswordRootState(props));
}

export function usePasswordInput(props: PasswordInputStateProps) {
	return new PasswordInputState(ctx.get(), props);
}

export function usePasswordToggleVisibility() {
	return new PasswordToggleVisibilityState(ctx.get());
}

export function usePasswordCopy() {
	return new PasswordCopyState(ctx.get());
}

export function usePasswordStrength() {
	return new PasswordStrengthState(ctx.get());
}

export function usePasswordError() {
	return new PasswordErrorState(ctx.get());
}
