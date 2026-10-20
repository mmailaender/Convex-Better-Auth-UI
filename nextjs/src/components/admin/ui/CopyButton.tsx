'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';

/** Copies `text`, showing a check for a moment after. */
export default function CopyButton({ text, label }: { text: string; label: string }) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Couldn't copy");
		}
	}
	return (
		<button
			type="button"
			className="hover:preset-tonal rounded-base flex size-6 shrink-0 items-center justify-center"
			aria-label={copied ? 'Copied' : label}
			onClick={copy}
		>
			{copied ? (
				<Check className="size-4" aria-hidden="true" />
			) : (
				<Copy className="size-4" aria-hidden="true" />
			)}
		</button>
	);
}
