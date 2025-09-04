import type { Progress as ProgressPrimitive, Toggle as TogglePrimitive } from '@ark-ui/svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { CopyButtonProps } from '$lib/primitives/ui/copy-button/types';
import type { ZxcvbnResult } from '@zxcvbn-ts/core';
import type { WithChildren, WithoutChildren } from 'svelte-toolbelt';

export type PasswordRootPropsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
	hidden?: boolean;
	/** The minimum acceptable score for a password. (0-4)
	 *
	 * @default 3
	 */
	minScore?: 0 | 1 | 2 | 3 | 4;
}>;

export type PasswordRootProps = WithoutChildren<HTMLAttributes<HTMLDivElement>> &
	PasswordRootPropsWithoutHTML;

export type PasswordInputPropsWithoutHTML = WithChildren<{
	ref?: HTMLInputElement | null;
	value?: string;
}>;

export type PasswordInputProps = Omit<
	WithoutChildren<HTMLInputAttributes>,
	'type' | 'files' | 'aria-invalid' | 'value'
> &
	PasswordInputPropsWithoutHTML;

export type PasswordToggleVisibilityProps = Omit<
	TogglePrimitive.RootProps,
	'children' | 'pressed' | 'aria-label' | 'tabindex'
>;

export type PasswordCopyButtonProps = Omit<CopyButtonProps, 'children' | 'text'>;

export type PasswordStrengthPropsWithoutHTML = {
	strength?: ZxcvbnResult;
};

export type PasswordStrengthProps = PasswordStrengthPropsWithoutHTML &
	WithoutChildren<ProgressPrimitive.RootProps>;
