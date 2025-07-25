'use client';

import { authClient } from '@/components/auth/lib/auth-client';
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
						throw new Error('Invalid invitation response');
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
		return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
	}

	if (accepted) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				Invitation accepted! Redirecting to dashboard...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				Error Accepting Invite: {error}
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
