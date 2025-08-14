'use client';

import { authClient } from '@/components/auth/api/auth-client';
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const InvitationPage = () => {
	const { invitationId } = useParams();

	const [isLoading, setIsLoading] = useState(true);
	const [accepted, setAccepted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		if (invitationId) {
			authClient.organization
				.acceptInvitation({
					invitationId: invitationId as string
				})
				.then(({ data }) => {
					const orgId = data?.invitation?.organizationId;
					if (!orgId) {
						throw new Error('Invalid invitation');
					}
					setAccepted(true);
					router.push(`/`);
				})
				.catch((error) => {
					setError(error.message);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [invitationId]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center gap-4">
				<Loader2 className="size-10 animate-spin" />
				<h1 className="text-lg font-semibold">Accepting invitation…</h1>
				<p className="text-sm opacity-60">Please wait a moment.</p>
			</div>
		);
	}

	if (accepted) {
		return (
			<div className="flex flex-col items-center gap-4">
				<CheckCircle2 className="size-10" />
				<h1 className="text-lg font-semibold">Invitation accepted</h1>
				<p className="text-sm opacity-60">Redirecting to dashboard…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-4">
				<TriangleAlert className="size-10" />
				<h1 className="text-lg font-semibold">Couldn&apos;t accept invitation</h1>
				<p className="text-sm opacity-80">{error}</p>
				<Link className="btn preset-tonal hover:preset-filled" href="/">
					Go to Home
				</Link>
			</div>
		);
	}

	if (!invitationId) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				Please use a valid invite link.
			</div>
		);
	}
};

export default InvitationPage;
