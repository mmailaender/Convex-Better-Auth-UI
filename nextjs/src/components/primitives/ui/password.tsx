'use client';

import * as React from 'react';
import { Progress as ProgressPrimitive } from '@ark-ui/react/progress';
import type { ZxcvbnResult } from '@zxcvbn-ts/core';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
	createPasswordCheckerLoader,
	PASSWORD_STRENGTH_LABEL,
	passwordStrengthText,
	passwordValidityMessage,
	type PasswordChecker
} from '@/components/primitives/utils/passwordStrength';

// One checker per page, imported in the browser only. Next.js replaces `typeof window` with a
// constant in each build, so the server build drops this `import()` and zxcvbn with it.
const checkerLoader = createPasswordCheckerLoader(async () => {
	if (typeof window !== 'undefined') {
		const { passwordChecker } = await import('@/components/primitives/utils/passwordChecker');
		return passwordChecker;
	}
	// `globalThis`: this file's `Error` is the component below
	throw new globalThis.Error('The password strength checker loads in the browser only');
});

const PasswordContext = React.createContext<{
	visible: boolean;
	setVisible: React.Dispatch<React.SetStateAction<boolean>>;
	value: string;
	setValue: React.Dispatch<React.SetStateAction<string>>;
	minScore: number;
	/** Null while the checker loads, and always during SSR */
	strength: ZxcvbnResult | null;
	setStrengthMounted: React.Dispatch<React.SetStateAction<boolean>>;
	setValidityMessage: React.Dispatch<React.SetStateAction<string>>;
	submitted: boolean;
	setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
	inputEl: HTMLInputElement | null;
	setInputEl: React.Dispatch<React.SetStateAction<HTMLInputElement | null>>;
	errorId: string;
	errorMessage: string | null;
}>({
	visible: false,
	setVisible: () => {},
	value: '',
	setValue: () => {},
	minScore: 3,
	strength: null,
	setStrengthMounted: () => {},
	setValidityMessage: () => {},
	submitted: false,
	setSubmitted: () => {},
	inputEl: null,
	setInputEl: () => {},
	errorId: '',
	errorMessage: null
});

function getErrorMessage(
	input: HTMLInputElement | null,
	submitted: boolean,
	customMessage: string
) {
	if (!submitted || !input || input.validity.valid) return null;
	const placeholder = input.getAttribute('placeholder')?.trim();
	if (input.validity.valueMissing && placeholder) {
		return placeholder.endsWith('.') ? placeholder : `${placeholder}.`;
	}
	if (input.validity.valueMissing) return 'Enter a password.';
	return customMessage || input.validationMessage || 'Invalid value';
}

type RootProps = {
	children: React.ReactNode;
	hidden?: boolean;
	minScore?: number;
	onerror?: (error: { message: string }) => void;
};

function Root({ children, hidden = true, minScore = 3, onerror }: RootProps) {
	const [visible, setVisible] = React.useState(!hidden);
	const [value, setValue] = React.useState('');
	const [submitted, setSubmitted] = React.useState(false);
	const [inputEl, setInputEl] = React.useState<HTMLInputElement | null>(null);
	const errorId = React.useId();
	const [checker, setChecker] = React.useState<PasswordChecker | null>(checkerLoader.loaded);
	const [strengthMounted, setStrengthMounted] = React.useState(false);
	const strength = React.useMemo(() => checker?.check(value) ?? null, [checker, value]);
	// The input's custom validity message. Keeping it in state re-renders the error once the input
	// applies a new one, for example when the checker loads after a submit.
	const [validityMessage, setValidityMessage] = React.useState('');
	const errorMessage = getErrorMessage(inputEl, submitted, validityMessage);
	const lastErrorRef = React.useRef<string | null>(null);

	// Load the checker as soon as a part that needs a score mounts: the meter, or an input that
	// enforces `minScore`. It is usually ready before the first keystroke. Typing retries a load
	// that failed.
	const needsChecker = strengthMounted || minScore > 0;
	React.useEffect(() => {
		if (!needsChecker || checker) return;
		checkerLoader
			.load()
			.then(setChecker, (error: unknown) =>
				console.error('Could not load the password strength checker:', error)
			);
	}, [needsChecker, checker, value]);

	React.useEffect(() => {
		if (!errorMessage) {
			lastErrorRef.current = null;
			return;
		}
		if (errorMessage !== lastErrorRef.current) {
			onerror?.({ message: errorMessage });
			lastErrorRef.current = errorMessage;
		}
	}, [errorMessage, onerror]);

	return (
		<PasswordContext.Provider
			value={{
				visible,
				setVisible,
				value,
				setValue,
				minScore,
				strength,
				setStrengthMounted,
				setValidityMessage,
				submitted,
				setSubmitted,
				inputEl,
				setInputEl,
				errorId,
				errorMessage
			}}
		>
			<div className="flex flex-col gap-1.5">{children}</div>
		</PasswordContext.Provider>
	);
}

type InputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
	children?: React.ReactNode;
	ref?: React.Ref<HTMLInputElement>;
};

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
	if (!ref) return;
	if (typeof ref === 'function') ref(value);
	else ref.current = value;
}

function Input({
	className,
	children,
	onChange,
	onInvalid,
	value,
	defaultValue,
	ref,
	...props
}: InputProps) {
	const {
		visible,
		setValue,
		value: passwordValue,
		minScore,
		strength,
		setValidityMessage,
		setSubmitted,
		setInputEl,
		errorId,
		errorMessage
	} = React.useContext(PasswordContext);
	const inputRef = React.useRef<HTMLInputElement | null>(null);

	React.useEffect(() => {
		setValue(String(value ?? defaultValue ?? ''));
	}, [defaultValue, setValue, value]);

	React.useEffect(() => {
		const message = passwordValidityMessage(passwordValue, minScore, strength?.score ?? null);
		inputRef.current?.setCustomValidity(message);
		setValidityMessage(message);
	}, [minScore, passwordValue, strength, setValidityMessage]);

	React.useEffect(() => {
		const form = inputRef.current?.form;
		if (!form) return;
		const onSubmit = () => setSubmitted(true);
		const onInvalidCapture = () => setSubmitted(true);
		form.addEventListener('submit', onSubmit, true);
		form.addEventListener('invalid', onInvalidCapture, true);
		return () => {
			form.removeEventListener('submit', onSubmit, true);
			form.removeEventListener('invalid', onInvalidCapture, true);
		};
	}, [setSubmitted]);

	return (
		<div className="relative">
			<input
				ref={(node) => {
					inputRef.current = node;
					setInputEl(node);
					assignRef(ref, node);
				}}
				className={cn(
					'input transition-all',
					{
						'pr-9': Boolean(children)
					},
					className
				)}
				type={visible ? 'text' : 'password'}
				minLength={8}
				value={value}
				defaultValue={defaultValue}
				aria-describedby={errorMessage ? errorId : props['aria-describedby']}
				aria-invalid={errorMessage ? true : props['aria-invalid']}
				onChange={(event) => {
					setValue(event.currentTarget.value);
					setSubmitted(false);
					onChange?.(event);
				}}
				onInvalid={(event) => {
					setSubmitted(true);
					onInvalid?.(event);
				}}
				{...props}
			/>
			{children}
		</div>
	);
}

function ToggleVisibility({ className, ...props }: React.ComponentProps<'button'>) {
	const { visible, setVisible } = React.useContext(PasswordContext);
	return (
		<button
			type="button"
			className={cn(
				'data-[state=off]:text-muted-foreground data-[state=on]:text-muted-foreground hover:data-[state=off]:text-accent-foreground hover:data-[state=on]:text-accent-foreground absolute top-1/2 right-0 inline-flex size-9 min-w-0 -translate-y-1/2 items-center justify-center rounded-md bg-transparent p-0 outline-none hover:!bg-transparent data-[state=on]:bg-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
				className
			)}
			onClick={() => setVisible((value) => !value)}
			data-state={visible ? 'on' : 'off'}
			aria-label={visible ? 'Hide password' : 'Show password'}
			{...props}
		>
			{visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
		</button>
	);
}

function Error() {
	const { errorId, errorMessage } = React.useContext(PasswordContext);
	if (!errorMessage) return null;
	return (
		<span
			id={errorId}
			className="text-error-600-400 pt-1 pb-1 text-xs"
			aria-live="polite"
			role="status"
		>
			{errorMessage}
		</span>
	);
}

function Strength({ className }: { className?: string }) {
	const { value, strength, setStrengthMounted } = React.useContext(PasswordContext);
	// 0 until the checker has loaded
	const score = strength?.score ?? 0;
	const text = passwordStrengthText(value, strength?.score ?? null);

	React.useEffect(() => {
		setStrengthMounted(true);
		return () => setStrengthMounted(false);
	}, [setStrengthMounted]);

	const color =
		score <= 1
			? 'bg-error-600-400'
			: score === 2
				? 'bg-warning-700-300'
				: score === 3
					? 'bg-warning-600-400'
					: 'bg-success-600-400';

	return (
		<ProgressPrimitive.Root
			value={score}
			min={0}
			max={4}
			className={cn(
				'bg-surface-200-800 relative h-1 w-full gap-1 overflow-hidden rounded-full',
				className
			)}
		>
			{/* The track is the progressbar: Ark gives it the role and the value attributes */}
			<ProgressPrimitive.Track
				className="h-full w-full"
				aria-label={PASSWORD_STRENGTH_LABEL}
				aria-valuetext={text}
			>
				<ProgressPrimitive.Range
					className={cn('block h-full transition-all duration-500', color)}
					style={{ width: `${(score / 4) * 100}%` }}
				/>
			</ProgressPrimitive.Track>
			<div className="absolute top-0 left-0 z-10 flex h-1 w-full place-items-center gap-1 px-0.5">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className="ring-surface-100-900 h-1 w-1/4 rounded-full ring-3" />
				))}
			</div>
		</ProgressPrimitive.Root>
	);
}

export {
	Root,
	Input,
	ToggleVisibility,
	Error,
	Strength,
	Root as Password,
	Input as PasswordInput,
	ToggleVisibility as PasswordToggleVisibility,
	Error as PasswordError,
	Strength as PasswordStrength
};
